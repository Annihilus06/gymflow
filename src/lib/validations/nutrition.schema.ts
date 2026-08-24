import { z } from 'zod';
import { GoalTypeEnum } from './goal.schema';

export const calculateNutritionSchema = z.object({
  weightKg: z.number({ invalid_type_error: 'Weight must be a number' }).positive('Weight must be positive'),
  heightCm: z.number({ invalid_type_error: 'Height must be a number' }).positive('Height must be positive'),
  ageYears: z.number({ invalid_type_error: 'Age must be a number' }).int().min(1).max(120),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']),
  activityLevel: z.enum([
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'EXTRA_ACTIVE',
  ]),
  goalType: GoalTypeEnum,
});

export type CalculateNutritionInput = z.infer<typeof calculateNutritionSchema>;

export const logMealSchema = z.object({
  name: z.string().min(1, 'Meal name is required').max(100, 'Meal name is too long'),
  estimatedCalories: z
    .number({ invalid_type_error: 'Calories must be a number' })
    .min(0, 'Calories cannot be negative')
    .max(10000, 'Calories exceed realistic single-meal maximum'),
  estimatedProteinG: z
    .number({ invalid_type_error: 'Protein must be a number' })
    .min(0, 'Protein cannot be negative')
    .max(500, 'Protein exceeds realistic single-meal maximum'),
  loggedAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid loggedAt date format' })
    .optional(),
  notes: z.string().max(200).optional().nullable(),
});

export type LogMealInput = z.infer<typeof logMealSchema>;
