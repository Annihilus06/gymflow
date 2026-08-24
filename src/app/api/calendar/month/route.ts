import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CalendarService } from '@/lib/services/calendar.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : now.getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : now.getMonth() + 1;
    const todayOverride = searchParams.get('today') || undefined;

    const schedule = await CalendarService.getMonthlySchedule(
      session.user.id,
      year,
      month,
      todayOverride
    );

    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
