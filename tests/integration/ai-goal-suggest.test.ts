import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as suggestRoute } from '@/app/api/ai/suggest/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
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

describe('AI Goal Suggestion API (POST /api/ai/suggest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayLabel: 'Chest, Back & Triceps' }),
    });

    const res = await suggestRoute(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty dayLabel', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_123' } });

    const req = new Request('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayLabel: '' }),
    });

    const res = await suggestRoute(req);
    expect(res.status).toBe(400);
  });

  it('generates tailored suggestions for Sunday Chest, Back & Triceps day', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_123' } });

    mockPrisma.userProfile.findUnique.mockResolvedValueOnce({
      userId: 'user_123',
      experienceLevel: 'INTERMEDIATE',
      activityLevel: 'MODERATELY_ACTIVE',
    });

    mockPrisma.goal.findFirst.mockResolvedValueOnce({
      userId: 'user_123',
      type: 'MUSCLE_GAIN',
      status: 'ACTIVE',
    });

    const req = new Request('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayLabel: 'Chest, Back & Triceps',
        dayOfWeek: 'SUNDAY',
        currentExercises: [
          { name: 'Dumbbell Curl', primaryMuscle: 'Biceps' },
        ],
      }),
    });

    const res = await suggestRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.dayLabel).toBe('Chest, Back & Triceps');
    expect(json.dayOfWeek).toBe('SUNDAY');
    expect(json.goalAnalysis).toBeDefined();
    expect(json.splitAssessment).toBeDefined();
    expect(json.recommendedExercises.length).toBeGreaterThan(0);
    expect(json.formAndRecoveryTips.length).toBeGreaterThan(0);
  });
});
