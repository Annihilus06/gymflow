import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProfileService } from '@/lib/services/profile.service';
import { onboardingSchema } from '@/lib/validations/profile.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const result = await ProfileService.completeOnboarding(session.user.id, parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
