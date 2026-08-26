import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getRoutinesRoute, POST as createRoutineRoute } from '@/app/api/routines/route';
import {
  GET as getRoutineByIdRoute,
  PATCH as updateRoutineRoute,
  DELETE as deleteRoutineRoute,
} from '@/app/api/routines/[id]/route';
import { POST as activateRoutineRoute } from '@/app/api/routines/[id]/activate/route';
import { POST as duplicateRoutineRoute } from '@/app/api/routines/[id]/duplicate/route';
import { PATCH as updateRoutineDayRoute } from '@/app/api/routines/[id]/days/[dayId]/route';
import { POST as addExerciseRoute } from '@/app/api/routines/[id]/days/[dayId]/exercises/route';
import {
  PATCH as updateExerciseRoute,
  DELETE as removeExerciseRoute,
} from '@/app/api/routines/[id]/days/[dayId]/exercises/[exerciseId]/route';
import { PUT as reorderExercisesRoute } from '@/app/api/routines/[id]/days/[dayId]/exercises/reorder/route';
import { auth } from '@/lib/auth';

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    routine: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    routineDay: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    routineDayExercise: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    muscleGroup: {
      findUnique: vi.fn(),
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

describe('Routine Integration & Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDbRoutine = {
    id: 'routine_1',
    userId: 'user_1',
    name: 'Push Pull Legs',
    description: 'Hypertrophy Split',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    days: [
      {
        id: 'day_mon',
        routineId: 'routine_1',
        dayOfWeek: 'MONDAY',
        label: 'Chest & Triceps',
        isRestDay: false,
        exercises: [
          {
            id: 'rde_1',
            routineDayId: 'day_mon',
            exerciseId: 'ex_bench',
            displayOrder: 0,
            defaultSets: 4,
            defaultReps: 8,
            defaultWeightKg: 80,
            notes: 'Heavy compound',
            exercise: {
              id: 'ex_bench',
              name: 'Barbell Bench Press',
              category: 'STRENGTH',
              muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
            },
          },
          {
            id: 'rde_2',
            routineDayId: 'day_mon',
            exerciseId: 'ex_incline',
            displayOrder: 1,
            defaultSets: 3,
            defaultReps: 10,
            defaultWeightKg: 30,
            notes: null,
            exercise: {
              id: 'ex_incline',
              name: 'Incline Dumbbell Press',
              category: 'STRENGTH',
              muscles: [{ isPrimary: true, muscleGroup: { name: 'Chest' } }],
            },
          },
        ],
      },
      {
        id: 'day_tue',
        routineId: 'routine_1',
        dayOfWeek: 'TUESDAY',
        label: 'Back & Biceps',
        isRestDay: false,
        exercises: [],
      },
      {
        id: 'day_wed',
        routineId: 'routine_1',
        dayOfWeek: 'WEDNESDAY',
        label: 'Rest Day',
        isRestDay: true,
        exercises: [],
      },
    ],
  };

  describe('GET /api/routines', () => {
    it('returns 401 when unauthenticated', async () => {
      mockedAuth.mockResolvedValueOnce(null);
      const res = await getRoutinesRoute();
      expect(res.status).toBe(401);
    });

    it('returns user routines with day counts and workout/rest summary', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findMany.mockResolvedValueOnce([mockDbRoutine]);

      const res = await getRoutinesRoute();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe('Push Pull Legs');
      expect(json[0].totalExercises).toBe(2);
      expect(json[0].restDaysCount).toBe(1);
      expect(json[0].workoutDaysCount).toBe(6);
    });
  });

  describe('POST /api/routines', () => {
    it('creates a new routine with full 7-day schedule', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.count.mockResolvedValueOnce(0);
      mockPrisma.routine.create.mockResolvedValueOnce({ id: 'routine_new_1' });
      mockPrisma.routineDay.create.mockResolvedValue({ id: 'day_new' });
      mockPrisma.routine.findFirst.mockResolvedValueOnce({
        ...mockDbRoutine,
        id: 'routine_new_1',
        name: 'New Upper Lower Split',
      });

      const request = new Request('http://localhost:3000/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Upper Lower Split',
          description: '4 day strength split',
          isActive: true,
        }),
      });

      const res = await createRoutineRoute(request);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.id).toBe('routine_new_1');
      expect(json.name).toBe('New Upper Lower Split');
    });

    it('rejects invalid payload with 400 Validation Error', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });

      const request = new Request('http://localhost:3000/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Empty name
        }),
      });

      const res = await createRoutineRoute(request);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET & PATCH /api/routines/:id', () => {
    it('returns routine with 7 days and ordered exercises', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce(mockDbRoutine);

      const res = await getRoutineByIdRoute(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: 'routine_1' }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.name).toBe('Push Pull Legs');
      expect(json.days[0].exercises).toHaveLength(2);
      expect(json.days[0].exercises[0].name).toBe('Barbell Bench Press');
    });

    it('updates routine name and description', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValue(mockDbRoutine);
      mockPrisma.routine.update.mockResolvedValueOnce({
        ...mockDbRoutine,
        name: 'Updated Routine Name',
      });

      const request = new Request('http://localhost:3000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Routine Name' }),
      });

      const res = await updateRoutineRoute(request, { params: Promise.resolve({ id: 'routine_1' }) });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/routines/:id/activate', () => {
    it('activates targeted routine and deactivates others', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValue(mockDbRoutine);

      const res = await activateRoutineRoute(new Request('http://localhost:3000', { method: 'POST' }), {
        params: Promise.resolve({ id: 'routine_1' }),
      });
      expect(res.status).toBe(200);
      expect(mockPrisma.routine.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user_1', isActive: true },
        data: { isActive: false },
      });
    });
  });

  describe('POST /api/routines/:id/duplicate', () => {
    it('clones routine with all 7 days and associated exercises', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValue(mockDbRoutine);
      mockPrisma.routine.create.mockResolvedValueOnce({ id: 'cloned_routine_id' });
      mockPrisma.routineDay.create.mockResolvedValue({ id: 'cloned_day_id' });
      mockPrisma.routineDayExercise.create.mockResolvedValue({ id: 'cloned_rde_id' });

      const request = new Request('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Cloned PPL Split' }),
      });

      const res = await duplicateRoutineRoute(request, { params: Promise.resolve({ id: 'routine_1' }) });
      expect(res.status).toBe(201);
    });
  });

  describe('Day & Exercise Operations', () => {
    it('updates day label and rest day status', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce({ id: 'routine_1' });
      mockPrisma.routineDay.findFirst.mockResolvedValueOnce({ id: 'day_mon', routineId: 'routine_1' });
      mockPrisma.routineDay.update.mockResolvedValueOnce({ id: 'day_mon', label: 'Heavy Chest', isRestDay: false });

      const request = new Request('http://localhost:3000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Heavy Chest', isRestDay: false }),
      });

      const res = await updateRoutineDayRoute(request, { params: Promise.resolve({ id: 'routine_1', dayId: 'day_mon' }) });
      expect(res.status).toBe(200);
    });

    it('adds an exercise to a routine day', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce({ id: 'routine_1' });
      mockPrisma.routineDay.findFirst.mockResolvedValueOnce({ id: 'day_mon', exercises: [] });
      mockPrisma.exercise.findUnique.mockResolvedValueOnce({ id: 'ex_bench', name: 'Barbell Bench Press' });
      mockPrisma.routineDayExercise.create.mockResolvedValueOnce({
        id: 'rde_new',
        exerciseId: 'ex_bench',
        displayOrder: 0,
        defaultSets: 4,
        defaultReps: 8,
      });

      const request = new Request('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: 'ex_bench',
          defaultSets: 4,
          defaultReps: 8,
        }),
      });

      const res = await addExerciseRoute(request, { params: Promise.resolve({ id: 'routine_1', dayId: 'day_mon' }) });
      expect(res.status).toBe(201);
    });

    it('reorders exercises within a routine day', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValue(mockDbRoutine);
      mockPrisma.routineDayExercise.findMany.mockResolvedValueOnce([
        { id: 'rde_1', routineDayId: 'day_mon' },
        { id: 'rde_2', routineDayId: 'day_mon' },
      ]);

      const request = new Request('http://localhost:3000', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseIds: ['rde_2', 'rde_1'] }),
      });

      const res = await reorderExercisesRoute(request, { params: Promise.resolve({ id: 'routine_1', dayId: 'day_mon' }) });
      expect(res.status).toBe(200);
    });

    it('removes an exercise and compacts order', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce({ id: 'routine_1' });
      mockPrisma.routineDayExercise.findFirst.mockResolvedValueOnce({ id: 'rde_1', routineDayId: 'day_mon' });
      mockPrisma.routineDayExercise.findMany.mockResolvedValueOnce([]);

      const res = await removeExerciseRoute(new Request('http://localhost:3000', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'routine_1', dayId: 'day_mon', exerciseId: 'rde_1' }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/routines/:id', () => {
    it('deletes routine and cascades properly', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'user_1' } });
      mockPrisma.routine.findFirst.mockResolvedValueOnce({ id: 'routine_1', isActive: false });

      const res = await deleteRoutineRoute(new Request('http://localhost:3000', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'routine_1' }),
      });
      expect(res.status).toBe(200);
      expect(mockPrisma.routine.delete).toHaveBeenCalledWith({ where: { id: 'routine_1' } });
    });
  });

  describe('Cross-User Security & Authorization Isolation', () => {
    it('returns 404 (RULE-API-003) when user A attempts to access user B routine', async () => {
      mockedAuth.mockResolvedValueOnce({ user: { id: 'attacker_user_id' } });

      // Prisma scoped query returns null for mismatched userId
      mockPrisma.routine.findFirst.mockImplementationOnce((args: { where: { id: string; userId: string } }) => {
        expect(args.where.userId).toBe('attacker_user_id');
        return Promise.resolve(null);
      });

      const res = await getRoutineByIdRoute(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: 'victim_routine_id' }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe('NOT_FOUND');
    });
  });
});
