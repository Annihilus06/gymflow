import { z } from 'zod';

export const AIRecommendationTypeEnum = z.enum([
  'ORDERING',
  'EFFICIENCY',
  'PROGRESSION',
  'SUBSTITUTION',
  'GENERAL',
]);

export const AIWarningTypeEnum = z.enum([
  'EXCESSIVE_VOLUME',
  'MUSCLE_IMBALANCE',
  'REDUNDANCY',
  'RECOVERY_RISK',
]);

export const OrderedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  suggestedPosition: z.number().int().min(0),
  rationale: z.string().max(300),
});

export const AIRecommendationItemSchema = z.object({
  type: AIRecommendationTypeEnum,
  title: z.string().max(120),
  message: z.string().max(400),
  suggestedExerciseId: z.string().optional().nullable(),
  alternativeExerciseId: z.string().optional().nullable(),
});

export const AIWarningItemSchema = z.object({
  type: AIWarningTypeEnum,
  message: z.string().max(400),
  affectedMuscles: z.array(z.string()).optional().default([]),
});

export const WorkoutOptimizationOutputSchema = z.object({
  orderedExercises: z.array(OrderedExerciseSchema),
  recommendations: z.array(AIRecommendationItemSchema),
  warnings: z.array(AIWarningItemSchema),
  reasoningSummary: z.string().max(800),
});

export type WorkoutOptimizationOutput = z.infer<typeof WorkoutOptimizationOutputSchema>;

export const aiOptimizeInputSchema = z.object({
  routineId: z.string().min(1, 'Routine ID is required'),
  dayId: z.string().optional().nullable(),
  timeBudgetMinutes: z.number().int().min(15).max(180).optional().nullable(),
  availableEquipment: z.array(z.string()).optional().default([]),
  focusGoal: z.string().max(100).optional().nullable(),
});

export type AIOptimizeInput = z.infer<typeof aiOptimizeInputSchema>;
