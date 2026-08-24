import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as searchExercisesRoute } from '@/app/api/exercises/search/route';
import { ExerciseCacheService } from '@/lib/exercise-api/cache';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    exercise: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    muscleGroup: {
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

describe('Exercise External API Integration & Caching Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDbExercise = {
    id: 'ex_bench_1',
    externalId: 'ext_bench',
    name: 'Barbell Bench Press',
    description: 'Flat barbell bench press for chest.',
    instructions: ['Lie on bench', 'Press bar'],
    category: 'STRENGTH',
    imageUrl: null,
    videoUrl: null,
    updatedAt: new Date(), // Fresh cache
    muscles: [
      { isPrimary: true, muscleGroup: { name: 'Chest' } },
      { isPrimary: false, muscleGroup: { name: 'Triceps' } },
    ],
  };

  describe('GET /api/exercises/search', () => {
    it('returns 401 when unauthorized', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const req = new Request('http://localhost:3000/api/exercises/search?q=Bench+Press');
      const res = await searchExercisesRoute(req);
      expect(res.status).toBe(401);
    });

    it('returns empty results and UNMATCHED for empty query', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      const req = new Request('http://localhost:3000/api/exercises/search?q=');
      const res = await searchExercisesRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.matchStatus).toBe('UNMATCHED');
      expect(json.results).toEqual([]);
    });

    it('returns fresh cached exercises on cache hit without calling external network', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.exercise.findMany.mockResolvedValueOnce([mockDbExercise]);

      const req = new Request('http://localhost:3000/api/exercises/search?q=Bench+Press');
      const res = await searchExercisesRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.cacheHit).toBe(true);
      expect(json.bestMatch.name).toBe('Barbell Bench Press');
      expect(json.bestMatch.primaryMuscles).toContain('Chest');
    });

    it('queries external client, normalizes, and upserts cache on cache miss', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.exercise.findMany.mockResolvedValueOnce([]); // Cache miss
      mockPrisma.muscleGroup.findUnique.mockResolvedValueOnce({ id: 'mg_chest', name: 'Chest' });
      mockPrisma.exercise.findFirst.mockResolvedValueOnce(null); // Not in DB
      mockPrisma.exercise.create.mockResolvedValueOnce({ id: 'ex_new_cached' });

      const req = new Request('http://localhost:3000/api/exercises/search?q=Barbell+Squat');
      const res = await searchExercisesRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.cacheHit).toBe(false);
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.bestMatch.name).toContain('Squat');
      expect(mockPrisma.exercise.create).toHaveBeenCalled();
    });

    it('handles unmatched queries by returning low confidence / UNMATCHED state', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.exercise.findMany.mockResolvedValueOnce([]);

      const req = new Request('http://localhost:3000/api/exercises/search?q=XyZ999UnmatchedQuery');
      const res = await searchExercisesRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.matchStatus).toBe('UNMATCHED');
      expect(json.bestMatch).toBeNull();
    });
  });
});
