import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const activeSession = await SessionService.getActiveSession(session.user.id);
    return NextResponse.json({ activeSession }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
