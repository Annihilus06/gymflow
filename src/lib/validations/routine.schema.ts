import { z } from 'zod';

export const DayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const createRoutineDayExerciseSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  displayOrder: z.number().int().min(0),
  defaultSets: z.number().int().min(1, 'At least 1 set required').max(20),
  defaultReps: z.number().int().min(1, 'At least 1 rep required').max(100),
  defaultWeightKg: z.number().min(0).max(500).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

export const createRoutineDaySchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  label: z.string().max(50).optional().nullable(),
  isRestDay: z.boolean(),
  exercises: z.array(createRoutineDayExerciseSchema).optional(),
});

export const createRoutineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Routine name must be at least 2 characters')
    .max(60, 'Routine name must be at most 60 characters'),
  description: z.string().trim().max(300).optional().nullable(),
  isActive: z.boolean(),
  days: z.array(createRoutineDaySchema).optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;

export const updateRoutineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Routine name must be at least 2 characters')
    .max(60, 'Routine name must be at most 60 characters')
    .optional(),
  description: z.string().trim().max(300).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;

export const updateRoutineDaySchema = z.object({
  label: z.string().trim().max(50).optional().nullable(),
  isRestDay: z.boolean().optional(),
});

export type UpdateRoutineDayInput = z.infer<typeof updateRoutineDaySchema>;

export const addExerciseToDaySchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  displayOrder: z.number().int().min(0).optional(),
  defaultSets: z.number().int().min(1, 'At least 1 set required').max(20).default(3),
  defaultReps: z.number().int().min(1, 'At least 1 rep required').max(100).default(10),
  defaultWeightKg: z.number().min(0).max(500).optional().nullable(),
  notes: z.string().trim().max(300).optional().nullable(),
});

export type AddExerciseToDayInput = z.infer<typeof addExerciseToDaySchema>;

export const updateRoutineExerciseSchema = z.object({
  defaultSets: z.number().int().min(1).max(20).optional(),
  defaultReps: z.number().int().min(1).max(100).optional(),
  defaultWeightKg: z.number().min(0).max(500).optional().nullable(),
  notes: z.string().trim().max(300).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

export type UpdateRoutineExerciseInput = z.infer<typeof updateRoutineExerciseSchema>;

export const reorderExercisesSchema = z.object({
  exerciseIds: z
    .array(z.string().min(1))
    .min(1, 'At least one exercise ID is required for reordering'),
});

export type ReorderExercisesInput = z.infer<typeof reorderExercisesSchema>;

export const duplicateRoutineSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
});

export type DuplicateRoutineInput = z.infer<typeof duplicateRoutineSchema>;
