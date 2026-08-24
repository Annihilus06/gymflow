import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProgressService } from '@/lib/services/progress.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const records = await ProgressService.getPersonalRecords(session.user.id);
    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
