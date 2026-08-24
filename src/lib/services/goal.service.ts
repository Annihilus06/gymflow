import prisma from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import {
  computeGoalProgress,
  calculateDaysRemaining,
  deriveGoalTrackStatus,
  getGoalUnit,
  type GoalTrackStatus,
} from '@/lib/utils/goals';
import type { CreateGoalInput, UpdateGoalInput, UpdateGoalProgressInput } from '@/lib/validations/goal.schema';
import type { GoalType, GoalStatus } from '@/types/database';

export interface GoalWithCalculatedProgress {
  id: string;
  userId: string;
  type: GoalType;
  status: GoalStatus;
  title: string;
  description: string | null;
  startValue: number | null;
  currentValue: number | null;
  targetValue: number | null;
  unit: string;
  targetDate: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  progressPct: number;
  daysRemaining: number;
  trackStatus: GoalTrackStatus;
}

export class GoalService {
  /**
   * Enriches a raw database Goal with deterministic progress metrics.
   */
  private static formatGoalWithProgress(goal: {
    id: string;
    userId: string;
    type: GoalType;
    status: GoalStatus;
    title: string;
    description: string | null;
    startValue: number | null;
    currentValue: number | null;
    targetValue: number | null;
    targetDate: Date | null;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): GoalWithCalculatedProgress {
    const progressPct = computeGoalProgress(
      goal.startValue,
      goal.currentValue,
      goal.targetValue,
      goal.type
    );

    const daysRemaining = calculateDaysRemaining(goal.targetDate);
    const trackStatus = deriveGoalTrackStatus(
      goal.startedAt,
      goal.targetDate || new Date(),
      progressPct
    );
    const unit = getGoalUnit(goal.type);

    return {
      ...goal,
      progressPct,
      daysRemaining,
      trackStatus,
      unit,
    };
  }

  /**
   * Retrieves the currently active goal for a user with progress metrics.
   */
  static async getActiveGoal(userId: string): Promise<GoalWithCalculatedProgress | null> {
    const activeGoal = await prisma.goal.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!activeGoal) return null;
    return this.formatGoalWithProgress(activeGoal);
  }

  /**
   * Lists all goals (active, completed, archived) for a user.
   */
  static async listGoals(userId: string): Promise<{
    activeGoal: GoalWithCalculatedProgress | null;
    history: GoalWithCalculatedProgress[];
  }> {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = goals.map((g) => this.formatGoalWithProgress(g));
    const activeGoal = formatted.find((g) => g.status === 'ACTIVE') || null;
    const history = formatted.filter((g) => g.status !== 'ACTIVE');

    return { activeGoal, history };
  }

  /**
   * Creates a new goal.
   * STRICT CORE BUSINESS RULE: User can have AT MOST ONE active goal.
   * Throws 409 Conflict if an active goal already exists (RULE-TEST-004).
   */
  static async createGoal(userId: string, input: CreateGoalInput): Promise<GoalWithCalculatedProgress> {
    // Atomic check and creation inside transaction
    return prisma.$transaction(async (tx) => {
      const existingActive = await tx.goal.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      if (existingActive) {
        throw AppError.conflict(
          'CONFLICT',
          'You already have an active goal. Please complete or cancel it before creating a new one.'
        );
      }

      const created = await tx.goal.create({
        data: {
          userId,
          title: input.title,
          type: input.type,
          description: input.description,
          startValue: input.startValue,
          currentValue: input.currentValue ?? input.startValue,
          targetValue: input.targetValue,
          targetDate: new Date(input.targetDate),
          status: 'ACTIVE',
          startedAt: new Date(),
        },
      });

      return this.formatGoalWithProgress(created);
    });
  }

  /**
   * Updates goal metadata (title, target date, description).
   */
  static async updateGoal(
    userId: string,
    goalId: string,
    input: UpdateGoalInput
  ): Promise<GoalWithCalculatedProgress> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw AppError.notFound('Goal not found.');
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: input.title !== undefined ? input.title : undefined,
        targetValue: input.targetValue !== undefined ? input.targetValue : undefined,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        description: input.description !== undefined ? input.description : undefined,
      },
    });

    return this.formatGoalWithProgress(updated);
  }

  /**
   * Updates current measured progress value.
   * If goal reaches 100%, status is updated to COMPLETED.
   */
  static async updateGoalProgress(
    userId: string,
    goalId: string,
    input: UpdateGoalProgressInput
  ): Promise<GoalWithCalculatedProgress> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw AppError.notFound('Goal not found.');
    }

    const progressPct = computeGoalProgress(
      goal.startValue,
      input.currentValue,
      goal.targetValue,
      goal.type
    );

    const isNowCompleted = progressPct >= 100 && goal.status === 'ACTIVE';

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentValue: input.currentValue,
        status: isNowCompleted ? 'COMPLETED' : goal.status,
        completedAt: isNowCompleted ? new Date() : goal.completedAt,
      },
    });

    return this.formatGoalWithProgress(updated);
  }

  /**
   * Explicitly completes a goal.
   */
  static async completeGoal(userId: string, goalId: string): Promise<GoalWithCalculatedProgress> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw AppError.notFound('Goal not found.');
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        currentValue: goal.targetValue ?? goal.currentValue,
      },
    });

    return this.formatGoalWithProgress(updated);
  }

  /**
   * Cancels (archives) an active goal, allowing user to start a new goal.
   */
  static async cancelGoal(userId: string, goalId: string): Promise<GoalWithCalculatedProgress> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw AppError.notFound('Goal not found.');
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: 'ARCHIVED',
      },
    });

    return this.formatGoalWithProgress(updated);
  }

  /**
   * Deletes a goal record.
   */
  static async deleteGoal(userId: string, goalId: string): Promise<{ success: boolean }> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw AppError.notFound('Goal not found.');
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { success: true };
  }
}
