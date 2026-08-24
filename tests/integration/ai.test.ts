import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as optimizeRoute } from '@/app/api/ai/optimize/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    routine: {
      findFirst: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
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

describe('AI Workout Optimization Integration Tests (POST /api/ai/optimize)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRoutine = {
    id: 'routine_1',
    userId: 'user_1',
    name: 'Push Pull Legs',
    days: [
      {
        id: 'day_push',
        routineId: 'routine_1',
        dayOfWeek: 'MONDAY',
        name: 'Push Day',
        isRestDay: false,
        exercises: [
          {
            id: 'rde_fly',
            exerciseId: 'ex_fly',
            order: 0,
            defaultSets: 3,
            defaultReps: 12,
            notes: null,
            exercise: {
              id: 'ex_fly',
              name: 'Cable Fly',
              category: 'STRENGTH',
              muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
            },
          },
          {
            id: 'rde_bench',
            exerciseId: 'ex_bench',
            order: 1,
            defaultSets: 4,
            defaultReps: 8,
            notes: null,
            exercise: {
              id: 'ex_bench',
              name: 'Barbell Bench Press',
              category: 'STRENGTH',
              muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
            },
          },
        ],
      },
      {
        id: 'day_rest',
        routineId: 'routine_1',
        dayOfWeek: 'WEDNESDAY',
        name: 'Rest Day',
        isRestDay: true,
        exercises: [],
      },
    ],
  };

  it('returns 401 when unauthorized', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/ai/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routineId: 'routine_1' }),
    });

    const res = await optimizeRoute(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 if routine not found or belongs to another user (RULE-ARCH-004)', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
    mockPrisma.routine.findFirst.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/ai/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routineId: 'other_user_routine' }),
    });

    const res = await optimizeRoute(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 if selected day is a rest day', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
    mockPrisma.routine.findFirst.mockResolvedValueOnce(mockRoutine);

    const req = new Request('http://localhost:3000/api/ai/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routineId: 'routine_1', dayId: 'day_rest' }),
    });

    const res = await optimizeRoute(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with structured optimization recommendations without modifying DB (RULE-AI-003)', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
    mockPrisma.routine.findFirst.mockResolvedValueOnce(mockRoutine);
    mockPrisma.userProfile.findUnique.mockResolvedValueOnce({
      userId: 'user_1',
      experienceLevel: 'INTERMEDIATE',
      activityLevel: 'MODERATELY_ACTIVE',
      fitnessGoal: 'STRENGTH',
    });

    const req = new Request('http://localhost:3000/api/ai/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routineId: 'routine_1',
        dayId: 'day_push',
        timeBudgetMinutes: 60,
      }),
    });

    const res = await optimizeRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.orderedExercises).toHaveLength(2);
    // Bench press (compound) should be reordered before cable fly (isolation)
    expect(json.orderedExercises[0].exerciseId).toBe('rde_bench');
    expect(json.orderedExercises[1].exerciseId).toBe('rde_fly');
    expect(json.recommendations.length).toBeGreaterThan(0);
    expect(json.reasoningSummary).toBeDefined();
  });
});
