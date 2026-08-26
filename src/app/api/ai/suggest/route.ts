import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { AIService } from '@/lib/services/ai.service';
import { aiGoalSuggestionInputSchema } from '@/lib/validations/ai.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = aiGoalSuggestionInputSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid AI suggestion payload')
      );
    }

    const { dayLabel, dayOfWeek, userGoal, experienceLevel, currentExercises } = parsed.data;

    // Fetch user profile and active goal for authentic context if not explicitly overridden
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    const activeGoal = await prisma.goal.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
    });

    const effectiveGoal = userGoal || activeGoal?.type || 'MUSCLE_GAIN';
    const effectiveExperience = experienceLevel || profile?.experienceLevel || 'BEGINNER';

    const result = await AIService.suggestForGoal({
      dayLabel,
      dayOfWeek,
      userProfile: {
        dateOfBirth: profile?.dateOfBirth,
        activityLevel: profile?.activityLevel || 'MODERATELY_ACTIVE',
        experienceLevel: effectiveExperience as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        fitnessGoal: effectiveGoal,
      },
      currentExercises,
    });

    return NextResponse.json(
      {
        dayLabel,
        dayOfWeek,
        userGoal: effectiveGoal,
        experienceLevel: effectiveExperience,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
