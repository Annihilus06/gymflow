import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoalService } from '@/lib/services/goal.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const activeGoal = await GoalService.getActiveGoal(session.user.id);
    return NextResponse.json({ activeGoal }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
