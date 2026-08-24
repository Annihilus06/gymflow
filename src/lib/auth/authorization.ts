import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors/app-error';

export interface AuthContext {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

/**
 * Server-side authorization helper for route handlers and Server Actions.
 * Enforces that a valid user session exists.
 *
 * @throws AppError.unauthorized() if no active session
 * @returns AuthContext containing userId and session object
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw AppError.unauthorized('Please log in to continue.');
  }

  return {
    userId: session.user.id,
    session,
  };
}

/**
 * Enforces resource ownership.
 * Per RULE-API-003, returns 404 (Not Found) rather than 403 when a user attempts
 * to access another user's resource, preventing resource enumeration.
 *
 * @param resourceOwnerId - User ID who owns the targeted resource
 * @param currentUserId - Authenticated user ID making the request
 * @throws AppError.notFound() if owner does not match
 */
export function assertResourceOwnership(
  resourceOwnerId: string,
  currentUserId: string
): void {
  if (resourceOwnerId !== currentUserId) {
    throw AppError.notFound('Resource not found.');
  }
}
