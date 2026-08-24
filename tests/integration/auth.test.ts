import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { AuthService } from '@/lib/services/auth.service';
import { hashPassword } from '@/lib/auth/password';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: unknown) => {
      if (typeof cb === 'function') {
        return cb(mock);
      }
      return cb;
    }),
  };
  return { mockPrisma: mock };
});

vi.mock('@/lib/db/prisma', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('successfully registers a new user with hashed password and initial profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const mockCreatedUser = {
        id: 'clx_new_user_1',
        name: 'Jordan Smith',
        email: 'jordan@example.com',
        image: null,
        passwordHash: 'hashed_pw',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          id: 'clx_prof_1',
          userId: 'clx_new_user_1',
          onboardingComplete: false,
          activityLevel: 'MODERATELY_ACTIVE',
          experienceLevel: 'BEGINNER',
          weightUnit: 'KG',
          dateOfBirth: null,
          sex: null,
          heightCm: null,
          notificationsEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrisma.user.create.mockResolvedValueOnce(mockCreatedUser);

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jordan Smith',
          email: 'jordan@example.com',
          password: 'SecurePassword123',
        }),
      });

      const response = await registerRoute(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.message).toBe('Account created successfully.');
      expect(json.user.id).toBe('clx_new_user_1');
      expect(json.user.email).toBe('jordan@example.com');
      expect(json.user.onboardingComplete).toBe(false);
    });

    it('rejects registration with 409 Conflict when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing_user_id' });

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jordan Smith',
          email: 'alreadyexists@example.com',
          password: 'SecurePassword123',
        }),
      });

      const response = await registerRoute(request);
      expect(response.status).toBe(409);

      const json = await response.json();
      expect(json.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects malformed registration payload with 400 Validation Error', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: 'invalid-email',
          password: 'short',
        }),
      });

      const response = await registerRoute(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.details.fieldErrors).toBeDefined();
    });
  });

  describe('Credential Validation', () => {
    it('returns user data for valid credentials', async () => {
      const rawPassword = 'ValidPassword123';
      const hashedPassword = await hashPassword(rawPassword);

      const mockDbUser = {
        id: 'user_val_1',
        email: 'val@example.com',
        name: 'Validator',
        image: null,
        passwordHash: hashedPassword,
        profile: {
          onboardingComplete: true,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockDbUser);

      const result = await AuthService.validateCredentials('val@example.com', rawPassword);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('user_val_1');
      expect(result?.email).toBe('val@example.com');
      expect(result?.onboardingComplete).toBe(true);
    });

    it('returns null for incorrect password', async () => {
      const hashedPassword = await hashPassword('ActualPassword123');

      const mockDbUser = {
        id: 'user_val_1',
        email: 'val@example.com',
        name: 'Validator',
        image: null,
        passwordHash: hashedPassword,
        profile: { onboardingComplete: true },
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockDbUser);

      const result = await AuthService.validateCredentials('val@example.com', 'WrongPassword999');
      expect(result).toBeNull();
    });

    it('returns null when user is not found in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await AuthService.validateCredentials('nonexistent@example.com', 'Pass123');
      expect(result).toBeNull();
    });
  });
});
