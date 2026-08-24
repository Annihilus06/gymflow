import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as listGoalsRoute, POST as createGoalRoute } from '@/app/api/goals/route';
import { GET as getActiveGoalRoute } from '@/app/api/goals/active/route';
import { PATCH as updateGoalRoute, DELETE as deleteGoalRoute } from '@/app/api/goals/[id]/route';
import { POST as updateProgressRoute } from '@/app/api/goals/[id]/progress/route';
import { POST as completeGoalRoute } from '@/app/api/goals/[id]/complete/route';
import { POST as cancelGoalRoute } from '@/app/api/goals/[id]/cancel/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    goal: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe('Goal Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveGoal = {
    id: 'goal_active_1',
    userId: 'user_1',
    type: 'WEIGHT_LOSS',
    status: 'ACTIVE',
    title: 'Lose 5 kg',
    description: 'Caloric deficit and training',
    startValue: 85,
    currentValue: 82.5,
    targetValue: 80,
    targetDate: new Date(2026, 11, 31),
    startedAt: new Date(2026, 7, 1),
    completedAt: null,
    createdAt: new Date(2026, 7, 1),
    updatedAt: new Date(2026, 7, 24),
  };

  describe('POST /api/goals (Single Active Goal Constraint - RULE-TEST-004)', () => {
    it('returns 401 when unauthorized', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const req = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Lose 5 kg',
          type: 'WEIGHT_LOSS',
          startValue: 85,
          targetValue: 80,
          targetDate: '2026-12-31',
        }),
      });

      const res = await createGoalRoute(req);
      expect(res.status).toBe(401);
    });

    it('creates active goal when user has no currently active goal', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null); // No existing active goal
      mockPrisma.goal.create.mockResolvedValueOnce(mockActiveGoal);

      const req = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Lose 5 kg',
          type: 'WEIGHT_LOSS',
          startValue: 85,
          targetValue: 80,
          targetDate: '2026-12-31',
        }),
      });

      const res = await createGoalRoute(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('goal_active_1');
      expect(json.status).toBe('ACTIVE');
      expect(json.progressPct).toBe(50); // (85 - 82.5)/(85 - 80) * 100 = 50%
    });

    it('rejects with 409 Conflict if user attempts to create a second active goal (RULE-TEST-004)', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockActiveGoal); // Active goal already exists!

      const req = new Request('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Bench 100 kg',
          type: 'STRENGTH_TARGET',
          startValue: 80,
          targetValue: 100,
          targetDate: '2026-12-31',
        }),
      });

      const res = await createGoalRoute(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe('CONFLICT');
      expect(mockPrisma.goal.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/goals/active & GET /api/goals', () => {
    it('returns active goal with progress metrics or null', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockActiveGoal);

      const res = await getActiveGoalRoute();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activeGoal.id).toBe('goal_active_1');
      expect(json.activeGoal.progressPct).toBe(50);
      expect(json.activeGoal.unit).toBe('kg');
    });

    it('lists active goal and history records', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.goal.findMany.mockResolvedValueOnce([
        mockActiveGoal,
        {
          ...mockActiveGoal,
          id: 'goal_completed_old',
          status: 'COMPLETED',
          title: 'Bench 90 kg',
          startValue: 70,
          currentValue: 90,
          targetValue: 90,
        },
      ]);

      const res = await listGoalsRoute();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activeGoal.id).toBe('goal_active_1');
      expect(json.history).toHaveLength(1);
      expect(json.history[0].status).toBe('COMPLETED');
    });
  });

  describe('POST /api/goals/:id/progress (Progress Logging & Completion)', () => {
    it('updates current progress value and auto-completes when 100% is reached', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockActiveGoal);
      mockPrisma.goal.update.mockResolvedValueOnce({
        ...mockActiveGoal,
        currentValue: 80, // Target reached!
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/goals/goal_active_1/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: 80 }),
      });

      const res = await updateProgressRoute(req, { params: { id: 'goal_active_1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('COMPLETED');
      expect(json.progressPct).toBe(100);
    });
  });

  describe('POST /api/goals/:id/cancel', () => {
    it('cancels/archives active goal so user can create a new goal', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.goal.findFirst.mockResolvedValueOnce(mockActiveGoal);
      mockPrisma.goal.update.mockResolvedValueOnce({
        ...mockActiveGoal,
        status: 'ARCHIVED',
      });

      const req = new Request('http://localhost:3000/api/goals/goal_active_1/cancel', {
        method: 'POST',
      });

      const res = await cancelGoalRoute(req, { params: { id: 'goal_active_1' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ARCHIVED');
    });
  });

  describe('Cross-User Authorization Security', () => {
    it('returns 404 (RULE-API-003) when user tries to update another users goal', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_attacker' } });
      mockPrisma.goal.findFirst.mockResolvedValueOnce(null); // Not found for attacker

      const req = new Request('http://localhost:3000/api/goals/victim_goal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hacked Goal' }),
      });

      const res = await updateGoalRoute(req, { params: { id: 'victim_goal' } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe('NOT_FOUND');
    });
  });
});
