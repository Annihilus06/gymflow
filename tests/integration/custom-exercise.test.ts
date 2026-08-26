import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createExerciseRoute } from '@/app/api/exercises/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    exercise: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    muscleGroup: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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

describe('Custom Exercise API (POST /api/exercises)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if unauthenticated', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dumbbell Curl', primaryMuscle: 'Biceps' }),
    });

    const res = await createExerciseRoute(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload (missing name)', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_123' } });

    const req = new Request('http://localhost:3000/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', primaryMuscle: 'Biceps' }),
    });

    const res = await createExerciseRoute(req);
    expect(res.status).toBe(400);
  });

  it('creates custom exercise with primary and secondary muscle groups', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user_123' } });

    mockPrisma.muscleGroup.findFirst
      .mockResolvedValueOnce({ id: 'mg_biceps', name: 'Biceps', bodyPart: 'Arms' }) // primary
      .mockResolvedValueOnce({ id: 'mg_forearms', name: 'Forearms', bodyPart: 'Arms' }); // secondary

    mockPrisma.exercise.create.mockResolvedValueOnce({
      id: 'ex_custom_1',
      name: 'Incline Dumbbell Curl',
      category: 'STRENGTH',
      description: 'Long head bicep curl',
      instructions: ['Incline bench setup', 'Curl up'],
      imageUrl: null,
      videoUrl: 'https://youtube.com/watch?v=12345678901',
      isCustom: true,
      muscles: [
        { isPrimary: true, muscleGroup: { name: 'Biceps' } },
        { isPrimary: false, muscleGroup: { name: 'Forearms' } },
      ],
    });

    const req = new Request('http://localhost:3000/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incline Dumbbell Curl',
        category: 'STRENGTH',
        primaryMuscle: 'Biceps',
        secondaryMuscles: ['Forearms'],
        description: 'Long head bicep curl',
        instructions: ['Incline bench setup', 'Curl up'],
        videoUrl: 'https://youtube.com/watch?v=12345678901',
      }),
    });

    const res = await createExerciseRoute(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.id).toBe('ex_custom_1');
    expect(json.name).toBe('Incline Dumbbell Curl');
    expect(json.isCustom).toBe(true);
    expect(json.primaryMuscle).toBe('Biceps');
    expect(json.muscles).toHaveLength(2);
  });
});
