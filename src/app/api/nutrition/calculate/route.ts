import { NextResponse } from 'next/server';
import { NutritionService } from '@/lib/services/nutrition.service';
import { calculateNutritionSchema } from '@/lib/validations/nutrition.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = calculateNutritionSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(
        AppError.validation(parsed.error.flatten().fieldErrors, 'Invalid nutrition calculation inputs')
      );
    }

    const result = NutritionService.calculateTargets(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
