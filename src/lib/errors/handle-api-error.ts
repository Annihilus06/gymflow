import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './app-error';
import type { APIErrorResponse } from '@/types/api';

/**
 * Standard API error handler for Next.js Route Handlers.
 * Transforms domain errors, validation errors, and unexpected exceptions into a unified response shape.
 */
export function handleApiError(error: unknown, requestId?: string): NextResponse<APIErrorResponse> {
  const reqId = requestId || `req_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Zod validation errors
  if (error instanceof ZodError) {
    const responseBody: APIErrorResponse = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data.',
      details: {
        fieldErrors: error.flatten().fieldErrors,
        formErrors: error.flatten().formErrors,
      },
      requestId: reqId,
    };
    return NextResponse.json(responseBody, { status: 400 });
  }

  // 2. Custom AppError instances
  if (error instanceof AppError) {
    const responseBody: APIErrorResponse = {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      requestId: reqId,
    };
    return NextResponse.json(responseBody, { status: error.statusCode });
  }

  // 3. Prisma Known Request Errors (e.g. Unique constraint violation P2002)
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.join(', ') || 'resource';
      return NextResponse.json(
        {
          code: 'CONFLICT',
          message: `An account or record with this unique ${target} already exists.`,
          requestId: reqId,
        },
        { status: 409 }
      );
    }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          requestId: reqId,
        },
        { status: 404 }
      );
    }
    if (['P1000', 'P1001', 'P1002', 'P1003', 'P1017'].includes(prismaError.code)) {
      return NextResponse.json(
        {
          code: 'DATABASE_UNAVAILABLE',
          message:
            'Unable to connect to the database. Please verify the database server is running and DATABASE_URL is configured correctly.',
          requestId: reqId,
        },
        { status: 503 }
      );
    }
  }

  // 4. Standard JS Error
  if (error instanceof Error) {
    // eslint-disable-next-line no-console
    console.error(`[Unhandled API Error] [${reqId}]:`, error);

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred. Please try again.',
        ...(isDev ? { details: { message: error.message, stack: error.stack } } : {}),
        requestId: reqId,
      },
      { status: 500 }
    );
  }

  // 5. Fallback unknown error
  // eslint-disable-next-line no-console
  console.error(`[Unknown API Error] [${reqId}]:`, error);
  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
      requestId: reqId,
    },
    { status: 500 }
  );
}
