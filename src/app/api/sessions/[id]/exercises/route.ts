import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { addExerciseToSessionSchema } from '@/lib/validations/session.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = addExerciseToSessionSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid exercise payload')
      );
    }

    const exerciseLog = await SessionService.addExerciseToSession(
      session.user.id,
      params.id,
      parsed.data.exerciseId
    );

    return NextResponse.json(exerciseLog, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
