import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NutritionService } from '@/lib/services/nutrition.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const data = await NutritionService.getUserTargets(session.user.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
