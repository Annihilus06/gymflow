import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { updateExerciseLogSchema } from '@/lib/validations/session.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; exerciseLogId: string }> }
) {
  try {
    const { id, exerciseLogId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = updateExerciseLogSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid update payload')
      );
    }

    const updated = await SessionService.updateExerciseLog(
      session.user.id,
      id,
      exerciseLogId,
      parsed.data
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
