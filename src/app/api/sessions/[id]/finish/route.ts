import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { finishSessionSchema } from '@/lib/validations/session.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    let inputData = {};
    try {
      const body = await req.json();
      const parsed = finishSessionSchema.safeParse(body);
      if (!parsed.success) {
        return handleApiError(
          AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid finish session payload')
        );
      }
      inputData = parsed.data;
    } catch {
      // Body optional
    }

    const finishedSession = await SessionService.finishSession(session.user.id, params.id, inputData);
    return NextResponse.json(finishedSession, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
