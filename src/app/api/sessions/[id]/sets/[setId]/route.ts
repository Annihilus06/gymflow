import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { updateSetSchema } from '@/lib/validations/session.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; setId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = updateSetSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid set update payload')
      );
    }

    const updated = await SessionService.updateSet(
      session.user.id,
      params.id,
      params.setId,
      parsed.data
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; setId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const result = await SessionService.deleteSet(session.user.id, params.id, params.setId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
