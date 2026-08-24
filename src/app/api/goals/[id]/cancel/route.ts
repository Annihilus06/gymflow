import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoalService } from '@/lib/services/goal.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const cancelled = await GoalService.cancelGoal(session.user.id, params.id);
    return NextResponse.json(cancelled, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
