import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { abandonSessionSchema } from '@/lib/validations/session.schema';
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
      const parsed = abandonSessionSchema.safeParse(body);
      if (!parsed.success) {
        return handleApiError(
          AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid abandon session payload')
        );
      }
      inputData = parsed.data;
    } catch {
      // Body optional
    }

    const abandonedSession = await SessionService.abandonSession(session.user.id, params.id, inputData);
    return NextResponse.json(abandonedSession, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
