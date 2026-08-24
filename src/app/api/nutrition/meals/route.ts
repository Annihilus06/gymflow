import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NutritionService } from '@/lib/services/nutrition.service';
import { logMealSchema } from '@/lib/validations/nutrition.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = logMealSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid meal log data')
      );
    }

    const meal = await NutritionService.logMeal(session.user.id, parsed.data);
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
