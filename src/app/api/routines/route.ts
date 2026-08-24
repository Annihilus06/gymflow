import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RoutineService } from '@/lib/services/routine.service';
import { createRoutineSchema } from '@/lib/validations/routine.schema';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const routines = await RoutineService.getUserRoutines(session.user.id);
    return NextResponse.json(routines, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const body = await req.json();
    const parsed = createRoutineSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const routine = await RoutineService.createRoutine(session.user.id, parsed.data);
    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
