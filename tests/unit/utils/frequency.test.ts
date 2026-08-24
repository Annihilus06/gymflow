import { describe, it, expect } from 'vitest';
import {
  calculateFrequencyPercentage,
  calculateStreak,
  calculateConsistencyScore,
} from '@/lib/utils/frequency';

describe('Workout Frequency & Streak Utilities (100% Branch Coverage - RULE-AI-001)', () => {
  describe('calculateFrequencyPercentage', () => {
    it('returns 0 for 0 or negative completed workouts', () => {
      expect(calculateFrequencyPercentage(0, 5)).toBe(0);
      expect(calculateFrequencyPercentage(-1, 5)).toBe(0);
      expect(calculateFrequencyPercentage(NaN, 5)).toBe(0);
      expect(calculateFrequencyPercentage(4, NaN)).toBe(0);
    });

    it('returns 100 when planned workouts is 0 and user completed workouts', () => {
      expect(calculateFrequencyPercentage(3, 0)).toBe(100);
      expect(calculateFrequencyPercentage(2, -1)).toBe(100);
    });

    it('calculates exact frequency percentages', () => {
      expect(calculateFrequencyPercentage(4, 5)).toBe(80);
      expect(calculateFrequencyPercentage(3, 4)).toBe(75);
      expect(calculateFrequencyPercentage(1, 3)).toBe(33.3);
    });

    it('bounds percentage at 100% when completed exceeds planned', () => {
      expect(calculateFrequencyPercentage(6, 4)).toBe(100);
    });
  });

  describe('calculateStreak', () => {
    it('returns 0 for empty or null dates', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('calculates streak starting from today', () => {
      const ref = new Date(2026, 7, 24); // Aug 24
      const dates = ['2026-08-24', '2026-08-23', '2026-08-22'];
      expect(calculateStreak(dates, ref)).toBe(3);
    });

    it('calculates streak starting from yesterday if today not yet completed', () => {
      const ref = new Date(2026, 7, 24); // Aug 24
      const dates = ['2026-08-23', '2026-08-22'];
      expect(calculateStreak(dates, ref)).toBe(2);
    });

    it('returns 0 if last completed workout was before yesterday', () => {
      const ref = new Date(2026, 7, 24); // Aug 24
      const dates = ['2026-08-21', '2026-08-20'];
      expect(calculateStreak(dates, ref)).toBe(0);
    });
  });

  describe('calculateConsistencyScore', () => {
    it('returns 0 for 0 or invalid frequency', () => {
      expect(calculateConsistencyScore(0, 0)).toBe(0);
      expect(calculateConsistencyScore(-5, 2)).toBe(0);
      expect(calculateConsistencyScore(NaN, 2)).toBe(0);
    });

    it('calculates combined consistency score', () => {
      expect(calculateConsistencyScore(80, 2)).toBe(74); // 80*0.8 + 10 = 74
      expect(calculateConsistencyScore(100, 5)).toBe(100); // capped at 100
    });
  });
});
