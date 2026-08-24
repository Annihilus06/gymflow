import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/services/session.service';
import { startSessionSchema } from '@/lib/validations/session.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const cursor = searchParams.get('cursor') || undefined;

    const data = await SessionService.listCompletedSessions(session.user.id, limit, cursor);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    let inputData = {};
    try {
      const body = await req.json();
      const parsed = startSessionSchema.safeParse(body);
      if (!parsed.success) {
        return handleApiError(
          AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid start session payload')
        );
      }
      inputData = parsed.data;
    } catch {
      // Empty body allowed for ad-hoc / default today start
    }

    const workoutSession = await SessionService.startSession(session.user.id, inputData);
    return NextResponse.json(workoutSession, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
