import { describe, it, expect } from 'vitest';
import {
  createCustomExerciseSchema,
  listExercisesQuerySchema,
} from '@/lib/validations/exercise.schema';

describe('Exercise Validation Schemas', () => {
  describe('createCustomExerciseSchema', () => {
    it('validates a valid custom exercise payload', () => {
      const valid = {
        name: 'Incline Hammer Curl',
        category: 'STRENGTH',
        primaryMuscle: 'Biceps',
        secondaryMuscles: ['Forearms'],
        description: 'Bicep builder targeting the brachialis.',
        instructions: ['Sit on incline bench', 'Curl dumbbells neutral grip'],
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      const result = createCustomExerciseSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Incline Hammer Curl');
        expect(result.data.primaryMuscle).toBe('Biceps');
      }
    });

    it('rejects empty name', () => {
      const invalid = {
        name: '',
        primaryMuscle: 'Chest',
      };
      const result = createCustomExerciseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty primary muscle', () => {
      const invalid = {
        name: 'Custom Pushup',
        primaryMuscle: '',
      };
      const result = createCustomExerciseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('allows optional fields to be omitted or null', () => {
      const valid = {
        name: 'Dumbbell Floor Press',
        primaryMuscle: 'Chest',
      };
      const result = createCustomExerciseSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('STRENGTH');
        expect(result.data.secondaryMuscles).toEqual([]);
      }
    });
  });

  describe('listExercisesQuerySchema', () => {
    it('validates list query params with defaults', () => {
      const result = listExercisesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('coerces string limits', () => {
      const result = listExercisesQuerySchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });
  });
});
