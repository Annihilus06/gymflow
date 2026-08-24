import prisma from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import { getDayOfWeekEnum } from '@/lib/utils/calendar';
import type {
  StartSessionInput,
  LogSetInput,
  UpdateSetInput,
  UpdateExerciseLogInput,
  FinishSessionInput,
  AbandonSessionInput,
} from '@/lib/validations/session.schema';

const SESSION_INCLUDE = {
  exerciseLogs: {
    orderBy: { displayOrder: 'asc' as const },
    include: {
      exercise: {
        include: {
          muscles: {
            include: {
              muscleGroup: true,
            },
          },
        },
      },
      sets: {
        orderBy: { setNumber: 'asc' as const },
      },
    },
  },
};

export class SessionService {
  /**
   * Starts a new workout session or resumes an existing in-progress session.
   */
  static async startSession(userId: string, input?: StartSessionInput) {
    // 1. Check if user already has an active in-progress workout
    const active = await prisma.workoutSession.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      include: SESSION_INCLUDE,
    });

    if (active) {
      return active;
    }

    let routineDayId = input?.routineDayId ?? null;

    // If no routineDayId specified, look for today's routine day
    if (!routineDayId) {
      const todayDayOfWeek = getDayOfWeekEnum(new Date());
      const activeRoutine = await prisma.routine.findFirst({
        where: { userId, isActive: true },
        include: {
          days: {
            where: { dayOfWeek: todayDayOfWeek, isRestDay: false },
          },
        },
      });

      if (activeRoutine?.days[0]) {
        routineDayId = activeRoutine.days[0].id;
      }
    }

    // 2. If routineDayId is identified, load planned exercises
    let plannedExercises: {
      exerciseId: string;
      displayOrder: number;
      defaultSets: number;
      defaultReps: number;
      defaultWeightKg: number | null;
      notes: string | null;
    }[] = [];

    if (routineDayId) {
      const day = await prisma.routineDay.findUnique({
        where: { id: routineDayId },
        include: {
          exercises: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (day) {
        plannedExercises = day.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          displayOrder: e.displayOrder,
          defaultSets: e.defaultSets,
          defaultReps: e.defaultReps,
          defaultWeightKg: e.defaultWeightKg,
          notes: e.notes,
        }));
      }
    }

    // 3. Create workout session and seed exercise logs
    const session = await prisma.workoutSession.create({
      data: {
        userId,
        routineDayId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        notes: input?.notes ?? null,
        exerciseLogs: {
          create: plannedExercises.map((pe) => ({
            exerciseId: pe.exerciseId,
            displayOrder: pe.displayOrder,
            notes: pe.notes,
          })),
        },
      },
      include: SESSION_INCLUDE,
    });

    return session;
  }

  /**
   * Retrieves the current active workout session for the user.
   */
  static async getActiveSession(userId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      include: SESSION_INCLUDE,
    });

    return session;
  }

  /**
   * Retrieves a specific workout session by ID with ownership verification.
   */
  static async getSessionById(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: SESSION_INCLUDE,
    });

    if (!session) {
      throw AppError.notFound('Workout session not found');
    }

    return session;
  }

  /**
   * Lists completed workout sessions with pagination.
   */
  static async listCompletedSessions(userId: string, limit = 20, cursor?: string) {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId, status: 'COMPLETED' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { startedAt: 'desc' },
      include: SESSION_INCLUDE,
    });

    let nextCursor: string | undefined = undefined;
    if (sessions.length > limit) {
      const nextItem = sessions.pop();
      nextCursor = nextItem?.id;
    }

    return {
      sessions,
      nextCursor,
    };
  }

  /**
   * Adds an ad-hoc exercise to an in-progress workout session.
   */
  static async addExerciseToSession(userId: string, sessionId: string, exerciseId: string) {
    await this.assertActiveSessionOwner(userId, sessionId);

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw AppError.notFound('Exercise not found');
    }

    const currentCount = await prisma.exerciseLog.count({
      where: { sessionId },
    });

    const exerciseLog = await prisma.exerciseLog.create({
      data: {
        sessionId,
        exerciseId,
        displayOrder: currentCount,
      },
      include: {
        exercise: {
          include: {
            muscles: {
              include: { muscleGroup: true },
            },
          },
        },
        sets: true,
      },
    });

    return exerciseLog;
  }

  /**
   * Logs a completed set with idempotency check (RULE-API-004).
   */
  static async logSet(
    userId: string,
    sessionId: string,
    exerciseLogId: string,
    input: LogSetInput
  ) {
    await this.assertActiveSessionOwner(userId, sessionId);

    // Verify exercise log belongs to this session
    const exerciseLog = await prisma.exerciseLog.findFirst({
      where: { id: exerciseLogId, sessionId },
      include: { sets: true },
    });

    if (!exerciseLog) {
      throw AppError.notFound('Exercise log not found in this session');
    }

    // Idempotency check: if key matches existing set, return existing set
    if (input.idempotencyKey) {
      const existing = await prisma.setLog.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    const nextSetNumber = exerciseLog.sets.length + 1;

    const setLog = await prisma.setLog.create({
      data: {
        exerciseLogId,
        setNumber: nextSetNumber,
        targetReps: input.targetReps ?? null,
        actualReps: input.actualReps,
        weightKg: input.weightKg ?? 0,
        notes: input.notes ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });

    return setLog;
  }

  /**
   * Updates an existing set record.
   */
  static async updateSet(
    userId: string,
    sessionId: string,
    setId: string,
    input: UpdateSetInput
  ) {
    await this.assertActiveSessionOwner(userId, sessionId);

    const setLog = await prisma.setLog.findFirst({
      where: {
        id: setId,
        exerciseLog: { sessionId },
      },
    });

    if (!setLog) {
      throw AppError.notFound('Set log not found');
    }

    const updated = await prisma.setLog.update({
      where: { id: setId },
      data: {
        actualReps: input.actualReps !== undefined ? input.actualReps : undefined,
        weightKg: input.weightKg !== undefined ? input.weightKg : undefined,
        targetReps: input.targetReps !== undefined ? input.targetReps : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
    });

    return updated;
  }

  /**
   * Deletes a set record and re-indexes remaining set numbers.
   */
  static async deleteSet(userId: string, sessionId: string, setId: string) {
    await this.assertActiveSessionOwner(userId, sessionId);

    const setLog = await prisma.setLog.findFirst({
      where: {
        id: setId,
        exerciseLog: { sessionId },
      },
    });

    if (!setLog) {
      throw AppError.notFound('Set log not found');
    }

    const exerciseLogId = setLog.exerciseLogId;

    await prisma.$transaction(async (tx) => {
      await tx.setLog.delete({ where: { id: setId } });

      const remainingSets = await tx.setLog.findMany({
        where: { exerciseLogId },
        orderBy: { setNumber: 'asc' },
      });

      for (let i = 0; i < remainingSets.length; i++) {
        const item = remainingSets[i]!;
        if (item.setNumber !== i + 1) {
          await tx.setLog.update({
            where: { id: item.id },
            data: { setNumber: i + 1 },
          });
        }
      }
    });

    return { success: true };
  }

  /**
   * Updates an exercise log (e.g. skip exercise or edit notes).
   */
  static async updateExerciseLog(
    userId: string,
    sessionId: string,
    exerciseLogId: string,
    input: UpdateExerciseLogInput
  ) {
    await this.assertActiveSessionOwner(userId, sessionId);

    const log = await prisma.exerciseLog.findFirst({
      where: { id: exerciseLogId, sessionId },
    });

    if (!log) {
      throw AppError.notFound('Exercise log not found');
    }

    const updated = await prisma.exerciseLog.update({
      where: { id: exerciseLogId },
      data: {
        skipped: input.skipped !== undefined ? input.skipped : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
    });

    return updated;
  }

  /**
   * Finishes a workout session, calculates duration and total volume.
   */
  static async finishSession(userId: string, sessionId: string, input?: FinishSessionInput) {
    const session = await this.assertActiveSessionOwner(userId, sessionId);

    const fullSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        exerciseLogs: {
          include: { sets: true },
        },
      },
    });

    const finishedAt = new Date();
    const durationSecs =
      input?.durationSecs ??
      Math.max(1, Math.floor((finishedAt.getTime() - session.startedAt.getTime()) / 1000));

    // Calculate total volume and count total logged sets
    let totalVolumeKg = 0;
    let totalSetsLogged = 0;

    if (fullSession?.exerciseLogs) {
      for (const exLog of fullSession.exerciseLogs) {
        for (const set of exLog.sets) {
          totalVolumeKg += set.actualReps * set.weightKg;
          totalSetsLogged += 1;
        }
      }
    }

    // If 0 sets were logged, mark ABANDONED per specification
    const finalStatus = totalSetsLogged > 0 ? 'COMPLETED' : 'ABANDONED';

    const updatedSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: finalStatus,
        finishedAt,
        durationSecs,
        totalVolumeKg,
        notes: input?.notes ?? undefined,
      },
      include: SESSION_INCLUDE,
    });

    return updatedSession;
  }

  /**
   * Abandons an in-progress workout session.
   */
  static async abandonSession(userId: string, sessionId: string, input?: AbandonSessionInput) {
    await this.assertActiveSessionOwner(userId, sessionId);

    const updated = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'ABANDONED',
        finishedAt: new Date(),
        notes: input?.notes ?? undefined,
      },
      include: SESSION_INCLUDE,
    });

    return updated;
  }

  /**
   * Deletes a workout session.
   */
  static async deleteSession(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw AppError.notFound('Workout session not found');
    }

    await prisma.workoutSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }

  /**
   * Helper asserting the user owns an active in-progress workout session.
   */
  private static async assertActiveSessionOwner(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw AppError.notFound('Workout session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw AppError.badRequest('This workout session is already completed or abandoned');
    }

    return session;
  }
}
