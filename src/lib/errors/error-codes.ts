/**
 * Standard application error codes and default HTTP status mappings.
 */
export const ERROR_CODES = {
  // Authentication & Authorization (401, 403, 404)
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, message: 'Please log in to continue.' },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403, message: "You do not have access to this resource." },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404, message: 'The requested resource was not found.' },

  // Validation (400)
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Invalid input data.' },
  BAD_REQUEST: { code: 'BAD_REQUEST', status: 400, message: 'Bad request.' },

  // Conflict / Business Rule Violations (409)
  GOAL_ALREADY_ACTIVE: {
    code: 'GOAL_ALREADY_ACTIVE',
    status: 409,
    message: 'Only one active goal is allowed. Archive or complete your current goal first.',
  },
  SESSION_ALREADY_ACTIVE: {
    code: 'SESSION_ALREADY_ACTIVE',
    status: 409,
    message: 'You already have a workout in progress.',
  },
  CONFLICT: { code: 'CONFLICT', status: 409, message: 'A resource conflict occurred.' },

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429,
    message: 'Too many requests. Please slow down and try again later.',
  },

  // External / Third-party Failures (503)
  AI_UNAVAILABLE: {
    code: 'AI_UNAVAILABLE',
    status: 503,
    message: 'AI service is temporarily unavailable. Please try again in a moment.',
  },
  EXERCISE_API_UNAVAILABLE: {
    code: 'EXERCISE_API_UNAVAILABLE',
    status: 503,
    message: 'Exercise database service is temporarily unavailable.',
  },

  // Server Errors (500)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    status: 500,
    message: 'An unexpected internal error occurred. Please try again.',
  },
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODES;
