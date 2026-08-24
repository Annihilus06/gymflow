import { describe, it, expect } from 'vitest';
import {
  normalizeMuscleName,
  normalizeEquipment,
  normalizeDifficulty,
  calculateMatchConfidence,
  normalizeExternalExercise,
} from '@/lib/exercise-api/normalizer';

describe('Exercise Normalizer Utilities', () => {
  describe('normalizeMuscleName', () => {
    it('normalizes pectoral variations to Chest', () => {
      expect(normalizeMuscleName('chest')).toBe('Chest');
      expect(normalizeMuscleName('pectorals')).toBe('Chest');
      expect(normalizeMuscleName('pectoralis major')).toBe('Chest');
      expect(normalizeMuscleName('upper chest')).toBe('Chest');
    });

    it('normalizes back and lat variations', () => {
      expect(normalizeMuscleName('lats')).toBe('Lats');
      expect(normalizeMuscleName('latissimus dorsi')).toBe('Lats');
      expect(normalizeMuscleName('trapezius')).toBe('Traps');
      expect(normalizeMuscleName('erector spinae')).toBe('Lower Back');
    });

    it('normalizes leg and arm muscles', () => {
      expect(normalizeMuscleName('quadriceps')).toBe('Quads');
      expect(normalizeMuscleName('biceps brachii')).toBe('Biceps');
      expect(normalizeMuscleName('triceps brachii')).toBe('Triceps');
      expect(normalizeMuscleName('rectus abdominis')).toBe('Abs');
    });

    it('handles empty and unknown muscles gracefully', () => {
      expect(normalizeMuscleName(null)).toBe('Full Body');
      expect(normalizeMuscleName('rhomboids')).toBe('Upper Back');
      expect(normalizeMuscleName('calves')).toBe('Calves');
      expect(normalizeMuscleName('neck')).toBe('Neck');
    });
  });

  describe('normalizeEquipment', () => {
    it('normalizes standard equipment strings', () => {
      expect(normalizeEquipment('barbell')).toBe('Barbell');
      expect(normalizeEquipment('dumbbell')).toBe('Dumbbell');
      expect(normalizeEquipment('cable')).toBe('Cable');
      expect(normalizeEquipment('bodyweight')).toBe('Bodyweight');
      expect(normalizeEquipment('none')).toBe('Bodyweight');
      expect(normalizeEquipment('kettlebell')).toBe('Kettlebell');
      expect(normalizeEquipment('resistance band')).toBe('Resistance Band');
      expect(normalizeEquipment('smith')).toBe('Smith Machine');
      expect(normalizeEquipment('ez barbell')).toBe('EZ Bar');
    });

    it('handles null or custom equipment', () => {
      expect(normalizeEquipment(null)).toBe('Bodyweight');
      expect(normalizeEquipment('trap bar')).toBe('Trap bar');
    });
  });

  describe('normalizeDifficulty', () => {
    it('normalizes difficulty levels', () => {
      expect(normalizeDifficulty('beginner')).toBe('BEGINNER');
      expect(normalizeDifficulty('novice')).toBe('BEGINNER');
      expect(normalizeDifficulty('intermediate')).toBe('INTERMEDIATE');
      expect(normalizeDifficulty('advanced')).toBe('ADVANCED');
      expect(normalizeDifficulty('hard')).toBe('ADVANCED');
      expect(normalizeDifficulty(null)).toBe('INTERMEDIATE');
    });
  });

  describe('calculateMatchConfidence', () => {
    it('returns 1.0 for exact matches (case-insensitive)', () => {
      expect(calculateMatchConfidence('bench press', 'Bench Press')).toBe(1.0);
    });

    it('returns high score for substring inclusion', () => {
      expect(calculateMatchConfidence('bench', 'Barbell Bench Press')).toBe(0.85);
    });

    it('returns score proportional to matching tokens', () => {
      const score = calculateMatchConfidence('incline dumbbell press', 'Incline Dumbbell Fly');
      expect(score).toBeGreaterThan(0.5);
    });

    it('returns 0 for completely disjoint tokens', () => {
      expect(calculateMatchConfidence('squat', 'Bicep Curl')).toBe(0);
    });
  });

  describe('normalizeExternalExercise', () => {
    it('normalizes complete raw exercise record', () => {
      const raw = {
        id: 101,
        name: 'Incline Barbell Bench Press',
        target: 'upper chest',
        secondaryMuscles: ['triceps', 'anterior deltoid'],
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: ['Step 1: Set bench.', 'Step 2: Press bar.'],
        description: 'Great chest builder.',
        gifUrl: 'https://example.com/demo.gif',
      };

      const normalized = normalizeExternalExercise(raw, 'Incline Bench');
      expect(normalized.externalId).toBe('101');
      expect(normalized.name).toBe('Incline Barbell Bench Press');
      expect(normalized.primaryMuscles).toEqual(['Chest']);
      expect(normalized.secondaryMuscles).toEqual(['Triceps', 'Shoulders']);
      expect(normalized.equipment).toBe('Barbell');
      expect(normalized.difficulty).toBe('INTERMEDIATE');
      expect(normalized.instructions).toHaveLength(2);
      expect(normalized.imageUrl).toBe('https://example.com/demo.gif');
      expect(normalized.confidenceScore).toBeGreaterThan(0.6);
    });

    it('handles string-based instructions and fallback fields', () => {
      const raw = {
        name: 'Bodyweight Squat',
        instructions: 'Stand tall. Squat down to parallel. Stand back up.',
      };

      const normalized = normalizeExternalExercise(raw);
      expect(normalized.primaryMuscles).toEqual(['Full Body']);
      expect(normalized.equipment).toBe('Bodyweight');
      expect(normalized.instructions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
