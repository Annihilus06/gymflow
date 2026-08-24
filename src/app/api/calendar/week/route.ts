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
    const dateStr = searchParams.get('date') || undefined;
    const todayOverride = searchParams.get('today') || undefined;

    const weekly = await CalendarService.getWeeklySchedule(
      session.user.id,
      dateStr,
      todayOverride
    );

    return NextResponse.json(weekly, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
