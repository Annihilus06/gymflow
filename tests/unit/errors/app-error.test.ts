import { describe, it, expect } from 'vitest';
import { AppError } from '@/lib/errors/app-error';
import { ERROR_CODES } from '@/lib/errors/error-codes';
import { handleApiError } from '@/lib/errors/handle-api-error';
import { z } from 'zod';

describe('AppError', () => {
  it('creates an AppError with predefined error codes', () => {
    const error = AppError.unauthorized();
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe(ERROR_CODES.UNAUTHORIZED.message);
  });

  it('creates custom validation error with details', () => {
    const error = AppError.validation({ field: ['Required'] }, 'Custom validation message');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Custom validation message');
    expect(error.details).toEqual({ field: ['Required'] });
  });

  it('creates conflict error for active goals', () => {
    const error = AppError.conflict('GOAL_ALREADY_ACTIVE');
    expect(error.code).toBe('GOAL_ALREADY_ACTIVE');
    expect(error.statusCode).toBe(409);
  });
});

describe('handleApiError', () => {
  it('transforms ZodError into 400 response with field details', async () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: 'invalid-email' });
    if (!result.success) {
      const response = handleApiError(result.error, 'test-req-id');
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.requestId).toBe('test-req-id');
      expect(json.details.fieldErrors.email).toBeDefined();
    }
  });

  it('transforms AppError into appropriate status code response', async () => {
    const error = AppError.notFound('Workout session not found');
    const response = handleApiError(error);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.code).toBe('NOT_FOUND');
    expect(json.message).toBe('Workout session not found');
  });

  it('transforms generic Error into 500 internal error', async () => {
    const error = new Error('Unexpected database failure');
    const response = handleApiError(error, 'req-123');
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.code).toBe('INTERNAL_ERROR');
    expect(json.requestId).toBe('req-123');
  });
});
