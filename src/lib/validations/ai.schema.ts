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

export const SuggestedGoalExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().default('STRENGTH'),
  primaryMuscle: z.string().min(1).max(50),
  targetSets: z.number().int().min(1).max(10),
  targetReps: z.string().max(50),
  rationale: z.string().max(400),
});

export const AIGoalSuggestionOutputSchema = z.object({
  goalAnalysis: z.string().max(800),
  splitAssessment: z.string().max(600),
  recommendedExercises: z.array(SuggestedGoalExerciseSchema),
  formAndRecoveryTips: z.array(z.string().max(400)),
  suggestedRepRangeForGoal: z.string().max(100),
});

export type AIGoalSuggestionOutput = z.infer<typeof AIGoalSuggestionOutputSchema>;

export const aiGoalSuggestionInputSchema = z.object({
  dayLabel: z.string().min(1, 'Day label or muscle focus is required').max(100),
  dayOfWeek: z.string().optional().nullable(),
  routineId: z.string().optional().nullable(),
  dayId: z.string().optional().nullable(),
  userGoal: z.string().optional().nullable(),
  experienceLevel: z.string().optional().nullable(),
  currentExercises: z
    .array(
      z.object({
        name: z.string(),
        primaryMuscle: z.string().optional().nullable(),
        defaultSets: z.number().optional().nullable(),
        defaultReps: z.number().optional().nullable(),
      })
    )
    .optional()
    .default([]),
});

export type AIGoalSuggestionInput = z.infer<typeof aiGoalSuggestionInputSchema>;

