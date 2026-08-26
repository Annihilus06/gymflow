import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RoutineService } from '@/lib/services/routine.service';
import { addExerciseToDaySchema } from '@/lib/validations/routine.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id, dayId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const routine = await RoutineService.getRoutineById(session.user.id, id);
    const day = routine.days.find((d) => d.id === dayId);
    if (!day) {
      return handleApiError(AppError.notFound('Routine day not found.'));
    }

    return NextResponse.json(day.exercises, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id, dayId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = addExerciseToDaySchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const created = await RoutineService.addExerciseToDay(
      session.user.id,
      id,
      dayId,
      parsed.data
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
