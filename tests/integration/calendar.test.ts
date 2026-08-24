import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getMonthlyCalendarRoute } from '@/app/api/calendar/month/route';
import { GET as getWeeklyCalendarRoute } from '@/app/api/calendar/week/route';
import { GET as getDayWorkoutPlanRoute } from '@/app/api/calendar/day/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    routine: {
      findFirst: vi.fn(),
    },
    workoutSession: {
      findMany: vi.fn(),
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

describe('Calendar Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveRoutine = {
    id: 'routine_ppl_1',
    userId: 'user_1',
    name: 'Push Pull Legs',
    isActive: true,
    days: [
      {
        id: 'day_mon',
        routineId: 'routine_ppl_1',
        dayOfWeek: 'MONDAY',
        label: 'Chest & Triceps',
        isRestDay: false,
        exercises: [
          {
            id: 'rde_1',
            exerciseId: 'ex_bench',
            displayOrder: 0,
            defaultSets: 4,
            defaultReps: 8,
            defaultWeightKg: 85,
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
        id: 'day_wed',
        routineId: 'routine_ppl_1',
        dayOfWeek: 'WEDNESDAY',
        label: 'Rest & Recovery',
        isRestDay: true,
        exercises: [],
      },
    ],
  };

  describe('GET /api/calendar/month', () => {
    it('returns 401 when unauthorized', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const res = await getMonthlyCalendarRoute(
        new Request('http://localhost:3000/api/calendar/month')
      );
      expect(res.status).toBe(401);
    });

    it('returns monthly calendar matrix with dynamically derived statuses', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(mockActiveRoutine);
      mockPrisma.workoutSession.findMany.mockResolvedValueOnce([
        {
          id: 'session_comp_1',
          startedAt: new Date(2026, 7, 17), // Mon Aug 17, 2026
          completedAt: new Date(2026, 7, 17, 18, 0, 0),
        },
      ]);

      const req = new Request('http://localhost:3000/api/calendar/month?year=2026&month=8&today=2026-08-24');
      const res = await getMonthlyCalendarRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.year).toBe(2026);
      expect(json.month).toBe(8);
      expect(json.activeRoutine.name).toBe('Push Pull Legs');
      expect(json.grid.length % 7).toBe(0);

      // Verify today is highlighted
      const todayCell = json.grid.find((d: { dateStr: string }) => d.dateStr === '2026-08-24');
      expect(todayCell).toBeDefined();
      expect(todayCell.isToday).toBe(true);
      expect(todayCell.status).toBe('TODAY');
      expect(todayCell.label).toBe('Chest & Triceps');
      expect(todayCell.exercises).toHaveLength(1);

      // Verify completed day
      const completedCell = json.grid.find((d: { dateStr: string }) => d.dateStr === '2026-08-17');
      expect(completedCell).toBeDefined();
      expect(completedCell.status).toBe('COMPLETED');
      expect(completedCell.completedSessionId).toBe('session_comp_1');

      // Verify rest day
      const restCell = json.grid.find((d: { dateStr: string }) => d.dateStr === '2026-08-26');
      expect(restCell).toBeDefined();
      expect(restCell.status).toBe('REST');
      expect(restCell.isRestDay).toBe(true);
    });
  });

  describe('GET /api/calendar/week', () => {
    it('returns weekly 7-day schedule window', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(mockActiveRoutine);
      mockPrisma.workoutSession.findMany.mockResolvedValueOnce([]);

      const req = new Request('http://localhost:3000/api/calendar/week?date=2026-08-24&today=2026-08-24');
      const res = await getWeeklyCalendarRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.days).toHaveLength(7);
      expect(json.days[0].dayOfWeek).toBe('MONDAY');
      expect(json.days[0].exercises[0].name).toBe('Barbell Bench Press');
    });
  });

  describe('GET /api/calendar/day', () => {
    it('returns specific day workout plan', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(mockActiveRoutine);
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/calendar/day?date=2026-08-24&today=2026-08-24');
      const res = await getDayWorkoutPlanRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.dateStr).toBe('2026-08-24');
      expect(json.label).toBe('Chest & Triceps');
      expect(json.status).toBe('TODAY');
      expect(json.exercises).toHaveLength(1);
    });
  });
});
