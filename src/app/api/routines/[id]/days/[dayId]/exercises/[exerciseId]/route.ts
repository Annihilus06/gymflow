import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RoutineService } from '@/lib/services/routine.service';
import { updateRoutineExerciseSchema } from '@/lib/validations/routine.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; dayId: string; exerciseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = updateRoutineExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const updated = await RoutineService.updateRoutineExercise(
      session.user.id,
      params.id,
      params.dayId,
      params.exerciseId,
      parsed.data
    );
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; dayId: string; exerciseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const result = await RoutineService.removeExerciseFromDay(
      session.user.id,
      params.id,
      params.dayId,
      params.exerciseId
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
