import { describe, it, expect } from 'vitest';
import {
  calculateSetVolume,
  calculateVolume,
  formatVolume,
} from '@/lib/utils/volume';

describe('Volume Calculation Utilities (100% Branch Coverage - RULE-AI-001)', () => {
  describe('calculateSetVolume', () => {
    it('calculates reps * weight in kg', () => {
      expect(calculateSetVolume(10, 80)).toBe(800);
      expect(calculateSetVolume(8, 82.5)).toBe(660);
    });

    it('returns 0 for negative, zero, or NaN reps/weight', () => {
      expect(calculateSetVolume(0, 80)).toBe(0);
      expect(calculateSetVolume(10, 0)).toBe(0);
      expect(calculateSetVolume(-5, 80)).toBe(0);
      expect(calculateSetVolume(10, -50)).toBe(0);
      expect(calculateSetVolume(NaN, 80)).toBe(0);
      expect(calculateSetVolume(10, NaN)).toBe(0);
    });
  });

  describe('calculateVolume', () => {
    it('sums volume across multiple set entries', () => {
      const sets = [
        { actualReps: 8, weightKg: 80 }, // 640
        { actualReps: 8, weightKg: 80 }, // 640
        { reps: 6, weightKg: 85 }, // 510
      ];
      expect(calculateVolume(sets)).toBe(1790);
    });

    it('handles null, undefined, or empty sets array', () => {
      expect(calculateVolume(null)).toBe(0);
      expect(calculateVolume(undefined)).toBe(0);
      expect(calculateVolume([])).toBe(0);
    });
  });

  describe('formatVolume', () => {
    it('formats volume with thousands separator and unit', () => {
      expect(formatVolume(14250)).toEqual({
        value: 14250,
        unit: 'kg',
        display: '14,250 kg',
      });
      expect(formatVolume(null)).toEqual({
        value: 0,
        unit: 'kg',
        display: '0 kg',
      });
    });
  });
});
