import { describe, it, expect } from 'vitest';
import {
  startSessionSchema,
  logSetSchema,
  updateSetSchema,
  finishSessionSchema,
  abandonSessionSchema,
} from '@/lib/validations/session.schema';

describe('Workout Session Validation Schemas', () => {
  describe('logSetSchema', () => {
    it('accepts valid set payload', () => {
      const valid = {
        actualReps: 8,
        weightKg: 80,
        targetReps: 10,
        notes: 'Felt strong',
        idempotencyKey: 'key_123',
      };
      const result = logSetSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects actualReps less than 1', () => {
      const invalid = {
        actualReps: 0,
        weightKg: 50,
      };
      expect(logSetSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects negative weight', () => {
      const invalid = {
        actualReps: 10,
        weightKg: -5,
      };
      expect(logSetSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects weight greater than 500kg', () => {
      const invalid = {
        actualReps: 5,
        weightKg: 600,
      };
      expect(logSetSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('updateSetSchema', () => {
    it('accepts partial set updates', () => {
      expect(updateSetSchema.safeParse({ actualReps: 12 }).success).toBe(true);
      expect(updateSetSchema.safeParse({ weightKg: 82.5 }).success).toBe(true);
    });
  });

  describe('finishSessionSchema & abandonSessionSchema', () => {
    it('accepts valid finish and abandon payloads', () => {
      expect(finishSessionSchema.safeParse({ durationSecs: 3600, notes: 'Great chest pump' }).success).toBe(true);
      expect(abandonSessionSchema.safeParse({ notes: 'Felt unwell' }).success).toBe(true);
    });
  });
});
