import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProgressService } from '@/lib/services/progress.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week';
    const dateParam = searchParams.get('date');
    const referenceDate = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(referenceDate.getTime())) {
      return handleApiError(AppError.badRequest('Invalid date parameter format'));
    }

    if (period === 'month') {
      const data = await ProgressService.getMonthlyProgress(session.user.id, referenceDate);
      return NextResponse.json(data, { status: 200 });
    }

    if (period === 'year') {
      const data = await ProgressService.getYearlyProgress(session.user.id, referenceDate);
      return NextResponse.json(data, { status: 200 });
    }

    // Default: weekly
    const data = await ProgressService.getWeeklyProgress(session.user.id, referenceDate);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
