import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getTargetsRoute } from '@/app/api/nutrition/targets/route';
import { POST as calculateRoute } from '@/app/api/nutrition/calculate/route';
import { GET as getDailyRoute } from '@/app/api/nutrition/daily/route';
import { POST as logMealRoute } from '@/app/api/nutrition/meals/route';
import { DELETE as deleteMealRoute } from '@/app/api/nutrition/meals/[id]/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    userProfile: {
      findUnique: vi.fn(),
    },
    weightLog: {
      findFirst: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
    },
    mealLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
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

describe('Nutrition & Targets Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile = {
    userId: 'user_1',
    dateOfBirth: new Date('1996-08-24'), // 30yo
    sex: 'MALE',
    heightCm: 180,
    activityLevel: 'SEDENTARY',
  };

  const mockWeightLog = {
    weightKg: 80,
  };

  const mockGoal = {
    type: 'WEIGHT_LOSS',
  };

  const mockMeal = {
    id: 'meal_1',
    userId: 'user_1',
    name: 'Chicken and Rice',
    estimatedCalories: 650,
    estimatedProteinG: 45,
    loggedAt: new Date(2026, 7, 24, 12, 30, 0),
    notes: 'Lunch',
  };

  describe('GET /api/nutrition/targets', () => {
    it('returns 401 when unauthorized', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const res = await getTargetsRoute();
      expect(res.status).toBe(401);
    });

    it('returns calculated metrics and scientific disclaimer from user profile', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(mockProfile);
      mockPrisma.weightLog.findFirst.mockResolvedValueOnce(mockWeightLog);
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockGoal);

      const res = await getTargetsRoute();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.bmr).toBe(1780);
      expect(json.tdee).toBe(2136);
      expect(json.dailyCalorieTarget).toBe(1636);
      expect(json.dailyProteinTargetG).toBe(176);
      expect(json.disclaimer.isMedicalDiagnosis).toBe(false);
      expect(json.formulas.bmr).toContain('Mifflin-St Jeor');
    });
  });

  describe('POST /api/nutrition/calculate (Stateless)', () => {
    it('calculates targets for arbitrary inputs without requiring auth', async () => {
      const req = new Request('http://localhost:3000/api/nutrition/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: 60,
          heightCm: 165,
          ageYears: 25,
          sex: 'FEMALE',
          activityLevel: 'VERY_ACTIVE',
          goalType: 'MUSCLE_GAIN',
        }),
      });

      const res = await calculateRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.bmr).toBe(1345);
      expect(json.dailyCalorieTarget).toBe(2570);
    });

    it('rejects invalid inputs with 400 validation error', async () => {
      const req = new Request('http://localhost:3000/api/nutrition/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: -10, // Invalid!
          heightCm: 165,
          ageYears: 25,
          sex: 'FEMALE',
          activityLevel: 'VERY_ACTIVE',
          goalType: 'MUSCLE_GAIN',
        }),
      });

      const res = await calculateRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/nutrition/daily & POST /api/nutrition/meals', () => {
    it('returns daily meal progress and remaining calories', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(mockProfile);
      mockPrisma.weightLog.findFirst.mockResolvedValueOnce(mockWeightLog);
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockGoal);
      mockPrisma.mealLog.findMany.mockResolvedValueOnce([mockMeal]);

      const req = new Request('http://localhost:3000/api/nutrition/daily?date=2026-08-24');
      const res = await getDailyRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.consumedCalories).toBe(650);
      expect(json.consumedProteinG).toBe(45);
      expect(json.remainingCalories).toBe(1636 - 650); // 986
      expect(json.meals).toHaveLength(1);
    });

    it('logs meal intake successfully', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.mealLog.create.mockResolvedValueOnce(mockMeal);

      const req = new Request('http://localhost:3000/api/nutrition/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Chicken and Rice',
          estimatedCalories: 650,
          estimatedProteinG: 45,
        }),
      });

      const res = await logMealRoute(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.name).toBe('Chicken and Rice');
    });

    it('deletes meal when owned by session user', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.mealLog.findFirst.mockResolvedValueOnce(mockMeal);
      mockPrisma.mealLog.delete.mockResolvedValueOnce(mockMeal);

      const req = new Request('http://localhost:3000/api/nutrition/meals/meal_1', {
        method: 'DELETE',
      });

      const res = await deleteMealRoute(req, { params: Promise.resolve({ id: 'meal_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
