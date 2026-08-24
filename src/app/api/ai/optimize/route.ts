import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { AIService } from '@/lib/services/ai.service';
import { aiOptimizeInputSchema } from '@/lib/validations/ai.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = aiOptimizeInputSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid AI optimize payload')
      );
    }

    const { routineId, dayId, timeBudgetMinutes, focusGoal } = parsed.data;

    // 1. Verify routine ownership and include full structure
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        userId: session.user.id,
      },
      include: {
        days: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              orderBy: { displayOrder: 'asc' },
              include: {
                exercise: {
                  include: {
                    muscles: {
                      include: { muscleGroup: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!routine) {
      return handleApiError(AppError.notFound('Routine not found.'));
    }

    // 2. Select target day
    const targetDay = dayId
      ? routine.days.find((d) => d.id === dayId)
      : routine.days.find((d) => !d.isRestDay && d.exercises.length > 0) || routine.days[0];

    if (!targetDay || targetDay.isRestDay) {
      return handleApiError(AppError.badRequest('Selected day is a rest day.'));
    }

    if (targetDay.exercises.length === 0) {
      return handleApiError(
        AppError.badRequest('No exercises to optimize on this day. Please add exercises first.')
      );
    }

    // 3. Fetch user profile and active goal for context
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    const activeGoal = await prisma.goal.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
    });

    // 4. Map exercises for AI prompt
    const promptExercises = targetDay.exercises.map((rde) => ({
      id: rde.id,
      exerciseId: rde.exerciseId,
      name: rde.exercise.name,
      category: rde.exercise.category,
      muscles: rde.exercise.muscles.map((m) => m.muscleGroup.name),
      defaultSets: rde.defaultSets,
      defaultReps: rde.defaultReps,
      notes: rde.notes,
    }));

    // 5. Call AI Service (advisory only)
    const result = await AIService.optimizeWorkoutDay({
      dayLabel: targetDay.label || `Day ${targetDay.dayOfWeek}`,
      exercises: promptExercises,
      userProfile: profile
        ? {
            dateOfBirth: profile.dateOfBirth,
            activityLevel: profile.activityLevel,
            experienceLevel: profile.experienceLevel,
            fitnessGoal: activeGoal?.type || null,
          }
        : null,
      timeBudgetMinutes,
      focusGoal,
    });

    return NextResponse.json(
      {
        dayId: targetDay.id,
        dayLabel: targetDay.label,
        currentExercises: promptExercises,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
