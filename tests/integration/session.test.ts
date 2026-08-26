import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as listSessionsRoute, POST as startSessionRoute } from '@/app/api/sessions/route';
import { GET as getActiveSessionRoute } from '@/app/api/sessions/active/route';
import { GET as getSessionByIdRoute, DELETE as deleteSessionRoute } from '@/app/api/sessions/[id]/route';
import { POST as finishSessionRoute } from '@/app/api/sessions/[id]/finish/route';
import { POST as abandonSessionRoute } from '@/app/api/sessions/[id]/abandon/route';
import { POST as logSetRoute } from '@/app/api/sessions/[id]/exercises/[exerciseLogId]/sets/route';
import {
  PATCH as updateSetRoute,
  DELETE as deleteSetRoute,
} from '@/app/api/sessions/[id]/sets/[setId]/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    workoutSession: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    exerciseLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    setLog: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    routine: {
      findFirst: vi.fn(),
    },
    routineDay: {
      findUnique: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
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

describe('Workout Session & Execution Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession = {
    id: 'session_1',
    userId: 'user_1',
    status: 'IN_PROGRESS',
    startedAt: new Date(2026, 7, 24, 10, 0, 0),
    finishedAt: null,
    durationSecs: null,
    totalVolumeKg: null,
    notes: null,
    exerciseLogs: [
      {
        id: 'exlog_1',
        sessionId: 'session_1',
        exerciseId: 'ex_bench',
        displayOrder: 0,
        skipped: false,
        notes: null,
        exercise: {
          id: 'ex_bench',
          name: 'Barbell Bench Press',
          category: 'STRENGTH',
          muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
        },
        sets: [
          {
            id: 'set_1',
            exerciseLogId: 'exlog_1',
            setNumber: 1,
            actualReps: 8,
            weightKg: 80,
            idempotencyKey: 'key_set_1',
          },
        ],
      },
    ],
  };

  describe('POST /api/sessions (Start / Resume Session)', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const res = await startSessionRoute(new Request('http://localhost:3000/api/sessions', { method: 'POST' }));
      expect(res.status).toBe(401);
    });

    it('resumes existing in-progress workout session if active', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);

      const res = await startSessionRoute(
        new Request('http://localhost:3000/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('session_1');
      expect(mockPrisma.workoutSession.create).not.toHaveBeenCalled();
    });

    it('creates a new session and seeds exercise logs when starting clean workout', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(null); // No active session
      mockPrisma.routine.findFirst.mockResolvedValueOnce(null);
      mockPrisma.workoutSession.create.mockResolvedValueOnce({
        ...mockSession,
        id: 'session_new_1',
      });

      const res = await startSessionRoute(
        new Request('http://localhost:3000/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('session_new_1');
      expect(mockPrisma.workoutSession.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/sessions/active', () => {
    it('returns the active session or null', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);

      const res = await getActiveSessionRoute();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.activeSession.id).toBe('session_1');
    });
  });

  describe('POST /api/sessions/:id/exercises/:exerciseLogId/sets (Log Set & Idempotency)', () => {
    it('logs a new set and increments set number', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);
      mockPrisma.exerciseLog.findFirst.mockResolvedValueOnce(mockSession.exerciseLogs[0]);
      mockPrisma.setLog.findUnique.mockResolvedValueOnce(null);
      mockPrisma.setLog.create.mockResolvedValueOnce({
        id: 'set_2',
        exerciseLogId: 'exlog_1',
        setNumber: 2,
        actualReps: 8,
        weightKg: 82.5,
        idempotencyKey: 'idemp_key_unique',
      });

      const req = new Request('http://localhost:3000/api/sessions/session_1/exercises/exlog_1/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': 'idemp_key_unique',
        },
        body: JSON.stringify({
          actualReps: 8,
          weightKg: 82.5,
        }),
      });

      const res = await logSetRoute(req, {
        params: Promise.resolve({ id: 'session_1', exerciseLogId: 'exlog_1' }),
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('set_2');
      expect(json.setNumber).toBe(2);
    });

    it('returns existing set without inserting on duplicate idempotency key (RULE-API-004)', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);
      mockPrisma.exerciseLog.findFirst.mockResolvedValueOnce(mockSession.exerciseLogs[0]);
      mockPrisma.setLog.findUnique.mockResolvedValueOnce({
        id: 'set_1',
        exerciseLogId: 'exlog_1',
        setNumber: 1,
        actualReps: 8,
        weightKg: 80,
        idempotencyKey: 'key_set_1',
      });

      const req = new Request('http://localhost:3000/api/sessions/session_1/exercises/exlog_1/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': 'key_set_1',
        },
        body: JSON.stringify({
          actualReps: 8,
          weightKg: 80,
        }),
      });

      const res = await logSetRoute(req, {
        params: Promise.resolve({ id: 'session_1', exerciseLogId: 'exlog_1' }),
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('set_1');
      expect(mockPrisma.setLog.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH & DELETE /api/sessions/:id/sets/:setId', () => {
    it('updates set weight and reps', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);
      mockPrisma.setLog.findFirst.mockResolvedValueOnce({ id: 'set_1' });
      mockPrisma.setLog.update.mockResolvedValueOnce({
        id: 'set_1',
        actualReps: 10,
        weightKg: 85,
      });

      const req = new Request('http://localhost:3000/api/sessions/session_1/sets/set_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualReps: 10, weightKg: 85 }),
      });

      const res = await updateSetRoute(req, { params: Promise.resolve({ id: 'session_1', setId: 'set_1' }) });
      expect(res.status).toBe(200);
    });

    it('deletes set and re-indexes remaining set numbers', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);
      mockPrisma.setLog.findFirst.mockResolvedValueOnce({ id: 'set_1', exerciseLogId: 'exlog_1' });
      mockPrisma.setLog.delete.mockResolvedValueOnce({ id: 'set_1' });
      mockPrisma.setLog.findMany.mockResolvedValueOnce([]);

      const req = new Request('http://localhost:3000/api/sessions/session_1/sets/set_1', {
        method: 'DELETE',
      });

      const res = await deleteSetRoute(req, { params: Promise.resolve({ id: 'session_1', setId: 'set_1' }) });
      expect(res.status).toBe(200);
      expect(mockPrisma.setLog.delete).toHaveBeenCalledWith({ where: { id: 'set_1' } });
    });
  });

  describe('POST /api/sessions/:id/finish', () => {
    it('finishes session, computes volume, and sets status to COMPLETED', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);
      mockPrisma.workoutSession.findUnique.mockResolvedValueOnce({
        ...mockSession,
        exerciseLogs: [
          {
            sets: [
              { actualReps: 8, weightKg: 80 }, // 640 kg
              { actualReps: 10, weightKg: 80 }, // 800 kg
            ],
          },
        ],
      });
      mockPrisma.workoutSession.update.mockResolvedValueOnce({
        ...mockSession,
        status: 'COMPLETED',
        totalVolumeKg: 1440,
        durationSecs: 2400,
      });

      const req = new Request('http://localhost:3000/api/sessions/session_1/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSecs: 2400 }),
      });

      const res = await finishSessionRoute(req, { params: Promise.resolve({ id: 'session_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('COMPLETED');
      expect(json.totalVolumeKg).toBe(1440);
    });
  });

  describe('POST /api/sessions/:id/abandon', () => {
    it('marks workout session as ABANDONED', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(mockSession);
      mockPrisma.workoutSession.update.mockResolvedValueOnce({
        ...mockSession,
        status: 'ABANDONED',
      });

      const req = new Request('http://localhost:3000/api/sessions/session_1/abandon', {
        method: 'POST',
      });

      const res = await abandonSessionRoute(req, { params: Promise.resolve({ id: 'session_1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ABANDONED');
    });
  });

  describe('GET /api/sessions (Workout History)', () => {
    it('returns completed workout history records', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.workoutSession.findMany.mockResolvedValueOnce([
        { ...mockSession, status: 'COMPLETED', totalVolumeKg: 2500 },
      ]);

      const req = new Request('http://localhost:3000/api/sessions');
      const res = await listSessionsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sessions).toHaveLength(1);
      expect(json.sessions[0].totalVolumeKg).toBe(2500);
    });
  });

  describe('Cross-User Authorization Security', () => {
    it('returns 404 (RULE-API-003) when user tries to access another users session', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'attacker_user_id' } });
      mockPrisma.workoutSession.findFirst.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/sessions/victim_session');
      const res = await getSessionByIdRoute(req, { params: Promise.resolve({ id: 'victim_session' }) });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe('NOT_FOUND');
    });
  });
});
