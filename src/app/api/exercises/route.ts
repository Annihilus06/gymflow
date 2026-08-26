import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ExerciseService } from '@/lib/services/exercise.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';
import { createCustomExerciseSchema } from '@/lib/validations/exercise.schema';
import type { ExerciseCategory } from '@/types/database';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const category = (searchParams.get('category') as ExerciseCategory) || undefined;
    const muscleGroup = searchParams.get('muscleGroup') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const cursor = searchParams.get('cursor') || undefined;

    const result = await ExerciseService.listExercises({
      search,
      category,
      muscleGroup,
      limit,
      cursor,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = createCustomExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid exercise data.')
      );
    }

    const created = await ExerciseService.createCustomExercise(
      session.user.id,
      parsed.data
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
