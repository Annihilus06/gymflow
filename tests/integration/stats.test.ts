import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getStatsRoute } from '@/app/api/stats/route';
import { GET as getRecordsRoute } from '@/app/api/stats/records/route';
import { GET as getProgressionRoute } from '@/app/api/stats/progression/[exerciseId]/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    routine: {
      findFirst: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
    },
    setLog: {
      findMany: vi.fn(),
    },
    exerciseLog: {
      findMany: vi.fn(),
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

describe('Progress & Analytics Engine Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveRoutine = {
    id: 'routine_1',
    userId: 'user_1',
    isActive: true,
    days: [
      { id: 'day_1', dayOfWeek: 'MONDAY', isRestDay: false },
      { id: 'day_2', dayOfWeek: 'TUESDAY', isRestDay: false },
      { id: 'day_3', dayOfWeek: 'THURSDAY', isRestDay: false },
      { id: 'day_4', dayOfWeek: 'FRIDAY', isRestDay: false },
    ],
  };

  const mockCompletedSessions = [
    {
      id: 'session_1',
      userId: 'user_1',
      status: 'COMPLETED',
      startedAt: new Date(2026, 7, 24, 10, 0, 0), // Aug 24 (Monday)
      totalVolumeKg: 4200,
      durationSecs: 3600,
      exerciseLogs: [
        {
          exercise: {
            name: 'Barbell Bench Press',
            muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
          },
          sets: [{ actualReps: 8, weightKg: 80 }],
        },
      ],
    },
    {
      id: 'session_2',
      userId: 'user_1',
      status: 'COMPLETED',
      startedAt: new Date(2026, 7, 25, 10, 0, 0), // Aug 25 (Tuesday)
      totalVolumeKg: 5000,
      durationSecs: 3600,
      exerciseLogs: [],
    },
  ];

  describe('GET /api/stats (Weekly, Monthly, Yearly)', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const req = new Request('http://localhost:3000/api/stats');
      const res = await getStatsRoute(req);
      expect(res.status).toBe(401);
    });

    it('calculates weekly frequency, volume, and muscle breakdown accurately', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(mockActiveRoutine); // 4 planned days
      mockPrisma.workoutSession.findMany
        .mockResolvedValueOnce(mockCompletedSessions) // 2 sessions this week
        .mockResolvedValueOnce(mockCompletedSessions); // for streak calculation

      const req = new Request('http://localhost:3000/api/stats?period=week&date=2026-08-24');
      const res = await getStatsRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.period).toBe('week');
      expect(json.plannedWorkouts).toBe(4);
      expect(json.completedWorkouts).toBe(2);
      expect(json.missedWorkouts).toBe(2);
      expect(json.frequencyPct).toBe(50); // 2/4 * 100 = 50%
      expect(json.totalVolume.value).toBe(9200);
      expect(json.totalDurationSecs).toBe(7200);
      expect(json.muscleGroupBreakdown).toHaveLength(1);
      expect(json.muscleGroupBreakdown[0].name).toBe('Chest');
    });

    it('handles zero-data periods safely without NaN or crashes', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(null); // 0 planned days
      mockPrisma.workoutSession.findMany
        .mockResolvedValueOnce([]) // 0 completed sessions
        .mockResolvedValueOnce([]); // 0 streak dates

      const req = new Request('http://localhost:3000/api/stats?period=week');
      const res = await getStatsRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.frequencyPct).toBe(0);
      expect(json.totalVolume.value).toBe(0);
      expect(json.streak).toBe(0);
    });

    it('calculates monthly and yearly summaries', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(mockActiveRoutine);
      mockPrisma.workoutSession.findMany
        .mockResolvedValueOnce(mockCompletedSessions)
        .mockResolvedValueOnce(mockCompletedSessions);

      const req = new Request('http://localhost:3000/api/stats?period=month&date=2026-08-24');
      const res = await getStatsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.period).toBe('month');
      expect(json.completedWorkouts).toBe(2);
    });
  });

  describe('GET /api/stats/records (Personal Records)', () => {
    it('discovers all-time top weight lifted per exercise', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.setLog.findMany.mockResolvedValueOnce([
        {
          weightKg: 100,
          actualReps: 5,
          loggedAt: new Date(2026, 7, 24),
          exerciseLog: {
            exercise: {
              id: 'ex_bench',
              name: 'Barbell Bench Press',
              category: 'STRENGTH',
              muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
            },
          },
        },
      ]);

      const res = await getRecordsRoute();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.records).toHaveLength(1);
      expect(json.records[0].exerciseName).toBe('Barbell Bench Press');
      expect(json.records[0].maxWeightKg).toBe(100);
    });
  });

  describe('GET /api/stats/progression/:exerciseId', () => {
    it('returns chronological exercise progression points', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.exerciseLog.findMany.mockResolvedValueOnce([
        {
          session: { id: 's1', startedAt: new Date(2026, 7, 10) },
          sets: [{ actualReps: 8, weightKg: 80 }],
        },
        {
          session: { id: 's2', startedAt: new Date(2026, 7, 24) },
          sets: [{ actualReps: 8, weightKg: 85 }],
        },
      ]);

      const req = new Request('http://localhost:3000/api/stats/progression/ex_bench');
      const res = await getProgressionRoute(req, { params: { exerciseId: 'ex_bench' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.progression).toHaveLength(2);
      expect(json.progression[1].maxWeightKg).toBe(85);
    });
  });
});
