import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProfileService } from '@/lib/services/profile.service';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const exportData = await ProfileService.exportUserData(session.user.id);
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="gymflow-user-data-${session.user.id}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
