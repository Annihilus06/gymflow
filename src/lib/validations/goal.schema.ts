import { z } from 'zod';

export const GoalTypeEnum = z.enum([
  'WEIGHT_LOSS',
  'MUSCLE_GAIN',
  'STRENGTH_TARGET',
  'WORKOUT_FREQUENCY',
  'CUSTOM',
]);

export const GoalStatusEnum = z.enum([
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'ARCHIVED',
]);

export const createGoalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title is too long'),
  type: GoalTypeEnum,
  startValue: z.number({ invalid_type_error: 'Start value must be a number' }).min(0),
  targetValue: z.number({ invalid_type_error: 'Target value must be a number' }).min(0),
  currentValue: z.number().min(0).optional(),
  targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid target date format',
  }),
  description: z.string().max(300).optional().nullable(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  targetValue: z.number().min(0).optional(),
  targetDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid target date format',
    })
    .optional(),
  description: z.string().max(300).optional().nullable(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const updateGoalProgressSchema = z.object({
  currentValue: z.number({ invalid_type_error: 'Current value must be a number' }).min(0),
  notes: z.string().max(200).optional().nullable(),
});

export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
