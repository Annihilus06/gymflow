import { describe, it, expect } from 'vitest';
import {
  computeGoalProgress,
  calculateDaysRemaining,
  deriveGoalTrackStatus,
  getGoalUnit,
} from '@/lib/utils/goals';

describe('Goal Calculation Utilities (100% Branch Coverage - RULE-AI-001)', () => {
  describe('computeGoalProgress', () => {
    it('returns 0 for null, undefined, or NaN inputs', () => {
      expect(computeGoalProgress(null, 75, 70)).toBe(0);
      expect(computeGoalProgress(80, null, 70)).toBe(0);
      expect(computeGoalProgress(80, 75, null)).toBe(0);
      expect(computeGoalProgress(undefined, 75, 70)).toBe(0);
      expect(computeGoalProgress(NaN, 75, 70)).toBe(0);
      expect(computeGoalProgress(80, NaN, 70)).toBe(0);
      expect(computeGoalProgress(80, 75, NaN)).toBe(0);
    });

    it('handles start equals target properly', () => {
      expect(computeGoalProgress(80, 80, 80)).toBe(100);
      expect(computeGoalProgress(80, 75, 80)).toBe(0);
      expect(computeGoalProgress(80, 85, 80)).toBe(100);
    });

    it('calculates decreasing goals accurately (e.g. Weight Loss)', () => {
      // Start 90kg -> Target 80kg -> Current 85kg (50% progress)
      expect(computeGoalProgress(90, 85, 80, 'WEIGHT_LOSS')).toBe(50);
      // Start 100kg -> Target 80kg -> Current 80kg (100% progress)
      expect(computeGoalProgress(100, 80, 80, 'WEIGHT_LOSS')).toBe(100);
      // Gained weight instead (Start 90kg -> Current 95kg -> Target 80kg) => bounded 0%
      expect(computeGoalProgress(90, 95, 80, 'WEIGHT_LOSS')).toBe(0);
      // Lost more than target (Start 90kg -> Current 75kg -> Target 80kg) => bounded 100%
      expect(computeGoalProgress(90, 75, 80, 'WEIGHT_LOSS')).toBe(100);
    });

    it('calculates increasing goals accurately (e.g. Muscle Gain, Strength, Workout Count)', () => {
      // Start 70kg -> Target 80kg -> Current 75kg (50% progress)
      expect(computeGoalProgress(70, 75, 80, 'MUSCLE_GAIN')).toBe(50);
      // Start 0 workouts -> Target 20 workouts -> Current 15 (75% progress)
      expect(computeGoalProgress(0, 15, 20, 'WORKOUT_FREQUENCY')).toBe(75);
      // Below start value => bounded 0%
      expect(computeGoalProgress(70, 65, 80, 'MUSCLE_GAIN')).toBe(0);
      // Exceeded target => bounded 100%
      expect(computeGoalProgress(70, 85, 80, 'MUSCLE_GAIN')).toBe(100);
    });
  });

  describe('calculateDaysRemaining', () => {
    it('returns positive days for future dates', () => {
      const now = new Date(2026, 7, 24, 12, 0, 0);
      const target = new Date(2026, 7, 30, 12, 0, 0);
      expect(calculateDaysRemaining(target, now)).toBe(6);
    });

    it('returns 0 for past dates, null or invalid strings', () => {
      const now = new Date(2026, 7, 24, 12, 0, 0);
      const past = new Date(2026, 7, 20, 12, 0, 0);
      expect(calculateDaysRemaining(past, now)).toBe(0);
      expect(calculateDaysRemaining(null, now)).toBe(0);
      expect(calculateDaysRemaining('invalid-date', now)).toBe(0);
    });
  });

  describe('deriveGoalTrackStatus', () => {
    it('returns COMPLETED if progress is 100%', () => {
      const start = new Date(2026, 7, 1);
      const target = new Date(2026, 7, 30);
      expect(deriveGoalTrackStatus(start, target, 100)).toBe('COMPLETED');
    });

    it('returns ON_TRACK if progress is ahead of or equal to elapsed time', () => {
      const start = new Date(2026, 7, 1);
      const target = new Date(2026, 7, 31);
      const mid = new Date(2026, 7, 16); // 50% elapsed
      expect(deriveGoalTrackStatus(start, target, 55, mid)).toBe('ON_TRACK');
      expect(deriveGoalTrackStatus(start, target, 45, mid)).toBe('ON_TRACK'); // Within 10% buffer
    });

    it('returns BEHIND if progress lags behind elapsed time', () => {
      const start = new Date(2026, 7, 1);
      const target = new Date(2026, 7, 31);
      const mid = new Date(2026, 7, 16); // 50% elapsed
      expect(deriveGoalTrackStatus(start, target, 20, mid)).toBe('BEHIND');
    });

    it('handles edge cases (invalid dates, elapsed <= 0, past deadline)', () => {
      const start = new Date(2026, 7, 1);
      const target = new Date(2026, 7, 31);
      const beforeStart = new Date(2026, 6, 25);
      const pastTarget = new Date(2026, 8, 15);

      expect(deriveGoalTrackStatus('invalid', target, 50)).toBe('ON_TRACK');
      expect(deriveGoalTrackStatus(target, start, 50)).toBe('BEHIND'); // invalid duration
      expect(deriveGoalTrackStatus(start, target, 50, beforeStart)).toBe('ON_TRACK');
      expect(deriveGoalTrackStatus(start, target, 80, pastTarget)).toBe('BEHIND');
    });
  });

  describe('getGoalUnit', () => {
    it('returns kg for weight and muscle goals', () => {
      expect(getGoalUnit('WEIGHT_LOSS')).toBe('kg');
      expect(getGoalUnit('MUSCLE_GAIN')).toBe('kg');
      expect(getGoalUnit('STRENGTH_TARGET')).toBe('kg');
    });

    it('returns workouts for frequency goals', () => {
      expect(getGoalUnit('WORKOUT_FREQUENCY')).toBe('workouts');
    });

    it('returns units for custom goals', () => {
      expect(getGoalUnit('CUSTOM')).toBe('units');
    });
  });
});
