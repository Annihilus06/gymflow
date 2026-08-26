import { z } from 'zod';

export const exerciseCategoryEnum = z.enum([
  'STRENGTH',
  'CARDIO',
  'FLEXIBILITY',
  'BALANCE',
  'PLYOMETRICS',
]);

export const createCustomExerciseSchema = z.object({
  name: z
    .string()
    .min(1, 'Exercise name is required')
    .max(100, 'Exercise name must be under 100 characters')
    .trim(),
  category: exerciseCategoryEnum.default('STRENGTH'),
  primaryMuscle: z
    .string()
    .min(1, 'Primary target muscle is required')
    .max(50, 'Muscle name must be under 50 characters')
    .trim(),
  secondaryMuscles: z.array(z.string().trim()).optional().default([]),
  description: z.string().max(500, 'Description must be under 500 characters').optional().nullable(),
  instructions: z.array(z.string().trim()).optional().default([]),
  videoUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
});

export type CreateCustomExerciseInput = z.infer<typeof createCustomExerciseSchema>;

export const listExercisesQuerySchema = z.object({
  search: z.string().optional(),
  category: exerciseCategoryEnum.optional(),
  muscleGroup: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type ListExercisesQueryInput = z.infer<typeof listExercisesQuerySchema>;
