import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoalService } from '@/lib/services/goal.service';
import { updateGoalProgressSchema } from '@/lib/validations/goal.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = updateGoalProgressSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid goal progress data')
      );
    }

    const updated = await GoalService.updateGoalProgress(session.user.id, params.id, parsed.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
