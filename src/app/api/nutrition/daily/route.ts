import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NutritionService } from '@/lib/services/nutrition.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const referenceDate = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(referenceDate.getTime())) {
      return handleApiError(AppError.badRequest('Invalid date parameter'));
    }

    const data = await NutritionService.getDailyNutritionProgress(session.user.id, referenceDate);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
