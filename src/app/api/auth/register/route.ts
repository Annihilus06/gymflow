import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/validations/auth.schema';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const user = await AuthService.registerUser(parsed.data);

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
