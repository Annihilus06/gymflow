import { describe, it, expect } from 'vitest';
import {
  createRoutineSchema,
  updateRoutineSchema,
  updateRoutineDaySchema,
  addExerciseToDaySchema,
  updateRoutineExerciseSchema,
  reorderExercisesSchema,
} from '@/lib/validations/routine.schema';

describe('Routine Validation Schemas', () => {
  describe('createRoutineSchema', () => {
    it('accepts valid routine input with name and description', () => {
      const valid = {
        name: 'Upper Lower Split',
        description: '4-day strength routine',
        isActive: true,
      };
      const result = createRoutineSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects routine names shorter than 2 characters', () => {
      const invalid = {
        name: 'A',
        isActive: true,
      };
      const result = createRoutineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects routine names longer than 60 characters', () => {
      const invalid = {
        name: 'A'.repeat(65),
        isActive: true,
      };
      const result = createRoutineSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts full 7-day configuration', () => {
      const valid = {
        name: 'PPL Routine',
        isActive: true,
        days: [
          { dayOfWeek: 'MONDAY' as const, label: 'Push', isRestDay: false },
          { dayOfWeek: 'TUESDAY' as const, label: 'Pull', isRestDay: false },
          { dayOfWeek: 'WEDNESDAY' as const, label: 'Legs', isRestDay: false },
          { dayOfWeek: 'THURSDAY' as const, label: 'Rest', isRestDay: true },
          { dayOfWeek: 'FRIDAY' as const, label: 'Push', isRestDay: false },
          { dayOfWeek: 'SATURDAY' as const, label: 'Pull', isRestDay: false },
          { dayOfWeek: 'SUNDAY' as const, label: 'Rest', isRestDay: true },
        ],
      };
      const result = createRoutineSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('updateRoutineDaySchema', () => {
    it('accepts valid day label and isRestDay toggle', () => {
      expect(updateRoutineDaySchema.safeParse({ label: 'Chest & Delts' }).success).toBe(true);
      expect(updateRoutineDaySchema.safeParse({ isRestDay: true }).success).toBe(true);
      expect(
        updateRoutineDaySchema.safeParse({ label: 'Leg Day', isRestDay: false }).success
      ).toBe(true);
    });
  });

  describe('addExerciseToDaySchema', () => {
    it('accepts valid exercise parameters with defaults', () => {
      const valid = {
        exerciseId: 'ex_bench_press_1',
        defaultSets: 4,
        defaultReps: 8,
        defaultWeightKg: 80,
        notes: 'Keep shoulders back',
      };
      const result = addExerciseToDaySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects sets less than 1 or greater than 20', () => {
      expect(
        addExerciseToDaySchema.safeParse({ exerciseId: 'ex_1', defaultSets: 0 }).success
      ).toBe(false);
      expect(
        addExerciseToDaySchema.safeParse({ exerciseId: 'ex_1', defaultSets: 25 }).success
      ).toBe(false);
    });

    it('rejects negative default weights', () => {
      expect(
        addExerciseToDaySchema.safeParse({ exerciseId: 'ex_1', defaultWeightKg: -10 }).success
      ).toBe(false);
    });
  });

  describe('updateRoutineExerciseSchema', () => {
    it('accepts partial updates to sets, reps, weight, and notes', () => {
      const partial = {
        defaultSets: 5,
        defaultReps: 5,
        defaultWeightKg: 100,
      };
      expect(updateRoutineExerciseSchema.safeParse(partial).success).toBe(true);
    });
  });

  describe('reorderExercisesSchema', () => {
    it('accepts array of exercise IDs', () => {
      const valid = {
        exerciseIds: ['ex_item_1', 'ex_item_2', 'ex_item_3'],
      };
      expect(reorderExercisesSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects empty exerciseIds array', () => {
      const invalid = {
        exerciseIds: [],
      };
      expect(reorderExercisesSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
