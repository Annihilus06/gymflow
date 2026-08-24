import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NutritionService } from '@/lib/services/nutrition.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const result = await NutritionService.deleteMeal(session.user.id, params.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
