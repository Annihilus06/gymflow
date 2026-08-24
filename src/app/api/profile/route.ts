import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProfileService } from '@/lib/services/profile.service';
import { updateProfileSchema } from '@/lib/validations/profile.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const profile = await ProfileService.getProfile(session.user.id);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const updated = await ProfileService.updateProfile(session.user.id, parsed.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    await ProfileService.deleteAccount(session.user.id);
    return NextResponse.json({ success: true, message: 'Account permanently deleted' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
