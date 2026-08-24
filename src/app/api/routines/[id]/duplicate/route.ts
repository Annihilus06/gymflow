import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RoutineService } from '@/lib/services/routine.service';
import { duplicateRoutineSchema } from '@/lib/validations/routine.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    let duplicateName: string | undefined;
    try {
      const body = await req.json();
      const parsed = duplicateRoutineSchema.safeParse(body);
      if (parsed.success) {
        duplicateName = parsed.data.name;
      }
    } catch {
      // Body is optional for duplicate
    }

    const cloned = await RoutineService.duplicateRoutine(session.user.id, params.id, duplicateName);
    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
