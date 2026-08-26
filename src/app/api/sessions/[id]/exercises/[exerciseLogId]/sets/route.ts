import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { logSetSchema } from '@/lib/validations/session.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; exerciseLogId: string }> }
) {
  try {
    const { id, exerciseLogId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const idempotencyHeader = req.headers.get('X-Idempotency-Key') || req.headers.get('x-idempotency-key');
    const body = await req.json();
    const parsed = logSetSchema.safeParse({
      ...body,
      idempotencyKey: body.idempotencyKey || idempotencyHeader || undefined,
    });

    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid set payload')
      );
    }

    const setLog = await SessionService.logSet(
      session.user.id,
      id,
      exerciseLogId,
      parsed.data
    );

    return NextResponse.json(setLog, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
