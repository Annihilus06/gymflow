import { describe, it, expect, vi } from 'vitest';
import { assertResourceOwnership, requireAuth } from '@/lib/auth/authorization';
import { AppError } from '@/lib/errors/app-error';

// Mock auth from @/lib/auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

const mockedAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

describe('Authorization Helpers', () => {
  describe('assertResourceOwnership', () => {
    it('allows access when resource owner ID matches current user ID', () => {
      expect(() => assertResourceOwnership('user_123', 'user_123')).not.toThrow();
    });

    it('throws 404 AppError when user IDs do not match (preventing resource enumeration per RULE-API-003)', () => {
      expect(() => assertResourceOwnership('user_victim', 'user_attacker')).toThrow(AppError);

      try {
        assertResourceOwnership('user_victim', 'user_attacker');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('requireAuth', () => {
    it('returns userId and session when authenticated', async () => {
      const mockSession = { user: { id: 'user_authenticated_1', name: 'Alex' } };
      mockedAuth.mockResolvedValueOnce(mockSession);

      const result = await requireAuth();
      expect(result.userId).toBe('user_authenticated_1');
      expect(result.session).toEqual(mockSession);
    });

    it('throws 401 AppError when session is missing or invalid', async () => {
      mockedAuth.mockResolvedValueOnce(null);

      await expect(requireAuth()).rejects.toThrow(AppError);

      try {
        mockedAuth.mockResolvedValueOnce(null);
        await requireAuth();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).code).toBe('UNAUTHORIZED');
      }
    });
  });
});
