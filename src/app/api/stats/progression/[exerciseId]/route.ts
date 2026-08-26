import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProgressService } from '@/lib/services/progress.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(req: Request, { params }: { params: Promise<{ exerciseId: string }> }) {
  try {
    const { exerciseId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const progression = await ProgressService.getExerciseProgression(
      session.user.id,
      exerciseId
    );

    return NextResponse.json({ progression }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
