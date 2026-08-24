import { z } from 'zod';

export const startSessionSchema = z.object({
  routineDayId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const addExerciseToSessionSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  displayOrder: z.number().int().min(0).optional(),
});

export type AddExerciseToSessionInput = z.infer<typeof addExerciseToSessionSchema>;

export const logSetSchema = z.object({
  targetReps: z.number().int().min(1).max(100).optional().nullable(),
  actualReps: z.number().int().min(1, 'At least 1 rep required').max(100, 'Max 100 reps'),
  weightKg: z.number().min(0, 'Weight cannot be negative').max(500, 'Max weight is 500kg').default(0),
  notes: z.string().max(200).optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;

export const updateSetSchema = z.object({
  targetReps: z.number().int().min(1).max(100).optional().nullable(),
  actualReps: z.number().int().min(1, 'At least 1 rep required').max(100, 'Max 100 reps').optional(),
  weightKg: z.number().min(0, 'Weight cannot be negative').max(500, 'Max weight is 500kg').optional(),
  notes: z.string().max(200).optional().nullable(),
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;

export const updateExerciseLogSchema = z.object({
  skipped: z.boolean().optional(),
  notes: z.string().max(300).optional().nullable(),
});

export type UpdateExerciseLogInput = z.infer<typeof updateExerciseLogSchema>;

export const finishSessionSchema = z.object({
  durationSecs: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type FinishSessionInput = z.infer<typeof finishSessionSchema>;

export const abandonSessionSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export type AbandonSessionInput = z.infer<typeof abandonSessionSchema>;
