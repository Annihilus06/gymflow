import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WorkoutOptimizationOutputSchema,
  aiOptimizeInputSchema,
} from '@/lib/validations/ai.schema';
import { AIService } from '@/lib/services/ai.service';
import { AIClient } from '@/lib/ai/client';

describe('AI Output Validation & Business Rules (RULE-AI-002)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validOutput = {
    orderedExercises: [
      {
        exerciseId: 'rde_bench_1',
        suggestedPosition: 0,
        rationale: 'Heavy compound movement placed first.',
      },
      {
        exerciseId: 'rde_fly_2',
        suggestedPosition: 1,
        rationale: 'Isolation movement for chest hypertrophy.',
      },
    ],
    recommendations: [
      {
        type: 'ORDERING',
        title: 'Compound First',
        message: 'Prioritize barbell compound lifts.',
      },
    ],
    warnings: [
      {
        type: 'EXCESSIVE_VOLUME',
        message: 'Session volume is on the higher side.',
        affectedMuscles: ['Chest'],
      },
    ],
    reasoningSummary: 'Biomechanical optimization completed successfully.',
  };

  describe('WorkoutOptimizationOutputSchema', () => {
    it('validates structured AI output conforming to schema', () => {
      const parsed = WorkoutOptimizationOutputSchema.safeParse(validOutput);
      expect(parsed.success).toBe(true);
    });

    it('rejects output with invalid enum types', () => {
      const invalid = {
        ...validOutput,
        warnings: [{ type: 'INVALID_TYPE', message: 'Wrong type' }],
      };
      const parsed = WorkoutOptimizationOutputSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('rejects output missing required reasoningSummary', () => {
      const { reasoningSummary, ...invalid } = validOutput;
      const parsed = WorkoutOptimizationOutputSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('AIService Business-Rule Validation', () => {
    const mockExercises = [
      {
        id: 'rde_bench_1',
        exerciseId: 'ex_bench',
        name: 'Barbell Bench Press',
        category: 'STRENGTH',
        muscles: ['Chest', 'Triceps'],
        defaultSets: 4,
        defaultReps: 8,
      },
      {
        id: 'rde_fly_2',
        exerciseId: 'ex_fly',
        name: 'Cable Fly',
        category: 'STRENGTH',
        muscles: ['Chest'],
        defaultSets: 3,
        defaultReps: 12,
      },
    ];

    it('filters out hallucinated/invented exercise IDs not in original input list', async () => {
      const aiResponseWithHallucination = {
        ...validOutput,
        orderedExercises: [
          {
            exerciseId: 'hallucinated_fake_id_999',
            suggestedPosition: 0,
            rationale: 'Fake exercise',
          },
          {
            exerciseId: 'rde_bench_1',
            suggestedPosition: 1,
            rationale: 'Valid exercise',
          },
        ],
      };

      vi.spyOn(AIClient, 'generateWorkoutOptimization').mockResolvedValueOnce(
        JSON.stringify(aiResponseWithHallucination)
      );

      const result = await AIService.optimizeWorkoutDay({
        dayLabel: 'Chest Day',
        exercises: mockExercises,
      });

      // Hallucinated ID must be filtered out
      const resultIds = result.orderedExercises.map((e) => e.exerciseId);
      expect(resultIds).not.toContain('hallucinated_fake_id_999');
      expect(resultIds).toContain('rde_bench_1');
      expect(resultIds).toContain('rde_fly_2'); // Preserved missing exercise
    });

    it('throws validation AppError when AI returns malformed unparseable JSON', async () => {
      vi.spyOn(AIClient, 'generateWorkoutOptimization').mockResolvedValueOnce(
        'Malformed raw text not in JSON format'
      );

      await expect(
        AIService.optimizeWorkoutDay({
          dayLabel: 'Chest Day',
          exercises: mockExercises,
        })
      ).rejects.toThrow();
    });
  });
});
