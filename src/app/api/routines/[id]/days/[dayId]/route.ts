import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RoutineService } from '@/lib/services/routine.service';
import { updateRoutineDaySchema } from '@/lib/validations/routine.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = updateRoutineDaySchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const updated = await RoutineService.updateRoutineDay(
      session.user.id,
      params.id,
      params.dayId,
      parsed.data
    );
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
