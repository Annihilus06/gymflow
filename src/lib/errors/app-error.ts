import { ERROR_CODES, type ErrorCodeKey } from './error-codes';

/**
 * Custom application error class for predictable error handling across services and API routes.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    codeOrKey: ErrorCodeKey | string,
    message?: string,
    statusCode?: number,
    details?: unknown
  ) {
    const predefined = ERROR_CODES[codeOrKey as ErrorCodeKey];
    const finalCode = predefined ? predefined.code : codeOrKey;
    const finalMessage = message ?? (predefined ? predefined.message : 'An error occurred.');
    const finalStatus = statusCode ?? (predefined ? predefined.status : 500);

    super(finalMessage);
    this.name = 'AppError';
    this.code = finalCode;
    this.statusCode = finalStatus;
    this.details = details;
    this.isOperational = true;

    // Restore prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message?: string, details?: unknown): AppError {
    return new AppError('BAD_REQUEST', message, 400, details);
  }

  static validation(details?: unknown, message?: string): AppError {
    return new AppError('VALIDATION_ERROR', message, 400, details);
  }

  static unauthorized(message?: string): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message?: string): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static notFound(message?: string): AppError {
    return new AppError('NOT_FOUND', message, 404);
  }

  static conflict(code: ErrorCodeKey | string = 'CONFLICT', message?: string): AppError {
    return new AppError(code, message, 409);
  }

  static rateLimit(message?: string): AppError {
    return new AppError('RATE_LIMIT_EXCEEDED', message, 429);
  }

  static serviceUnavailable(
    code: 'AI_UNAVAILABLE' | 'EXERCISE_API_UNAVAILABLE' = 'AI_UNAVAILABLE',
    message?: string
  ): AppError {
    return new AppError(code, message, 503);
  }

  static internal(message?: string, details?: unknown): AppError {
    return new AppError('INTERNAL_ERROR', message, 500, details);
  }
}
