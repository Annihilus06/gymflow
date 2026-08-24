import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getProfileRoute, PATCH as patchProfileRoute } from '@/app/api/profile/route';
import { POST as onboardRoute } from '@/app/api/profile/onboard/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      upsert: vi.fn(),
    },
    weightLog: {
      create: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
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

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

const mockedAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

describe('Profile Integration & Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('returns 401 Unauthorized when no session exists', async () => {
      mockedAuth.mockResolvedValueOnce(null);

      const response = await getProfileRoute();
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 with deterministic metrics for authenticated user', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });

      const mockDbUser = {
        id: 'user_1',
        name: 'Sam Athlete',
        email: 'sam@gymflow.local',
        image: null,
        profile: {
          id: 'prof_1',
          userId: 'user_1',
          dateOfBirth: new Date('1996-01-01'),
          sex: 'MALE',
          heightCm: 180,
          weightUnit: 'KG',
          activityLevel: 'MODERATELY_ACTIVE',
          experienceLevel: 'INTERMEDIATE',
          onboardingComplete: true,
          notificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        weightLogs: [
          {
            id: 'wl_1',
            userId: 'user_1',
            weightKg: 80,
            loggedAt: new Date(),
            notes: null,
          },
        ],
        goals: [
          {
            id: 'g_1',
            userId: 'user_1',
            type: 'MUSCLE_GAIN',
            status: 'ACTIVE',
            title: 'Muscle Gain',
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockDbUser);

      const response = await getProfileRoute();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.id).toBe('user_1');
      expect(json.name).toBe('Sam Athlete');
      expect(json.metrics.currentWeightKg).toBe(80);
      expect(json.metrics.bmi).toBe(24.69);
      expect(json.metrics.bmiCategory).toBe('Normal weight');
      expect(json.metrics.dailyCalorieTarget).toBeGreaterThan(2000);
      expect(json.metrics.dailyProteinTargetG).toBe(160);
    });
  });

  describe('POST /api/profile/onboard', () => {
    it('completes onboarding transaction and returns updated profile with metrics', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_onboarding_1' } });

      const updatedUser = {
        id: 'user_onboarding_1',
        name: 'Jordan Onboarded',
        email: 'jordan@example.com',
        image: null,
        profile: {
          id: 'prof_new',
          userId: 'user_onboarding_1',
          dateOfBirth: new Date('1998-05-15'),
          sex: 'FEMALE',
          heightCm: 165,
          weightUnit: 'KG',
          activityLevel: 'LIGHTLY_ACTIVE',
          experienceLevel: 'BEGINNER',
          onboardingComplete: true,
          notificationsEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        weightLogs: [{ id: 'wl_new', userId: 'user_onboarding_1', weightKg: 62, loggedAt: new Date() }],
        goals: [{ id: 'g_new', userId: 'user_onboarding_1', type: 'WEIGHT_LOSS', status: 'ACTIVE' }],
      };

      mockPrisma.goal.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(updatedUser);

      const request = new Request('http://localhost:3000/api/profile/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jordan Onboarded',
          dateOfBirth: '1998-05-15',
          sex: 'FEMALE',
          heightCm: 165,
          currentWeightKg: 62,
          targetWeightKg: 58,
          weightUnit: 'KG',
          activityLevel: 'LIGHTLY_ACTIVE',
          experienceLevel: 'BEGINNER',
          fitnessGoal: 'WEIGHT_LOSS',
          notificationsEnabled: false,
        }),
      });

      const response = await onboardRoute(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.name).toBe('Jordan Onboarded');
      expect(json.profile.onboardingComplete).toBe(true);
      expect(json.metrics.bmi).toBe(22.77);
      expect(json.metrics.dailyProteinTargetG).toBe(136);
    });

    it('rejects invalid onboarding input with 400 Validation Error', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });

      const request = new Request('http://localhost:3000/api/profile/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heightCm: 10,
          currentWeightKg: 5,
        }),
      });

      const response = await onboardRoute(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/profile', () => {
    it('updates profile and returns refreshed metrics', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });

      const updatedUser = {
        id: 'user_1',
        name: 'Updated Name',
        email: 'user1@example.com',
        image: null,
        profile: {
          id: 'prof_1',
          userId: 'user_1',
          dateOfBirth: new Date('1995-01-01'),
          sex: 'MALE',
          heightCm: 182,
          weightUnit: 'KG',
          activityLevel: 'VERY_ACTIVE',
          experienceLevel: 'ADVANCED',
          onboardingComplete: true,
          notificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        weightLogs: [{ id: 'wl_2', userId: 'user_1', weightKg: 85, loggedAt: new Date() }],
        goals: [],
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(updatedUser);

      const request = new Request('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
          heightCm: 182,
          currentWeightKg: 85,
          activityLevel: 'VERY_ACTIVE',
        }),
      });

      const response = await patchProfileRoute(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.name).toBe('Updated Name');
      expect(json.metrics.currentWeightKg).toBe(85);
      expect(json.metrics.bmi).toBe(25.66);
      expect(json.metrics.bmiCategory).toBe('Overweight');
    });
  });

  describe('Security & User Isolation', () => {
    it('strictly isolates data: server query always scopes to session userId', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'attacker_user_id' } });

      mockPrisma.user.findUnique.mockImplementationOnce((args: { where: { id: string } }) => {
        expect(args.where.id).toBe('attacker_user_id');
        return Promise.resolve(null);
      });

      const response = await getProfileRoute();
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.code).toBe('NOT_FOUND');
    });
  });
});
