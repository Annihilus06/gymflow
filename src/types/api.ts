/**
 * Standard API error structure across all endpoints.
 */
export interface APIErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Standard cursor-based pagination metadata.
 */
export interface PaginationMeta {
  cursor?: string;
  hasMore: boolean;
  limit: number;
  total?: number;
}

/**
 * Standard paginated response envelope.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Standard API success response envelope.
 */
export interface APISuccessResponse<T> {
  data: T;
  message?: string;
}
