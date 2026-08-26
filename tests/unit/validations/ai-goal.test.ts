import { describe, it, expect } from 'vitest';
import {
  aiGoalSuggestionInputSchema,
  AIGoalSuggestionOutputSchema,
} from '@/lib/validations/ai.schema';

describe('AI Goal Suggestion Schemas', () => {
  it('validates a valid goal suggestion input payload', () => {
    const valid = {
      dayLabel: 'Chest, Back & Triceps',
      dayOfWeek: 'SUNDAY',
      userGoal: 'MUSCLE_GAIN',
      experienceLevel: 'INTERMEDIATE',
      currentExercises: [
        { name: 'Dumbbell Curl', primaryMuscle: 'Biceps' },
      ],
    };

    const result = aiGoalSuggestionInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects input with empty dayLabel', () => {
    const invalid = {
      dayLabel: '',
    };
    const result = aiGoalSuggestionInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates a well-formed AI output structure', () => {
    const validOutput = {
      goalAnalysis: 'Analysis for Muscle Gain hypertrophy.',
      splitAssessment: 'Chest and Back paired as antagonist muscles.',
      recommendedExercises: [
        {
          name: 'Incline Dumbbell Press',
          category: 'STRENGTH',
          primaryMuscle: 'Chest',
          targetSets: 3,
          targetReps: '8-12 reps',
          rationale: 'Upper chest clavicular head focus.',
        },
      ],
      formAndRecoveryTips: [
        'Rest 90s between heavy sets',
      ],
      suggestedRepRangeForGoal: '8-12 reps (Hypertrophy)',
    };

    const result = AIGoalSuggestionOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });
});
