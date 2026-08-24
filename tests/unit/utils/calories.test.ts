import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
} from '@/lib/utils/calories';

describe('calculateAge', () => {
  it('calculates age correctly when birthday has already occurred this year', () => {
    const refDate = new Date('2026-08-24');
    expect(calculateAge('2000-01-15', refDate)).toBe(26);
  });

  it('calculates age correctly when birthday has not occurred yet this year', () => {
    const refDate = new Date('2026-08-24');
    expect(calculateAge('2000-11-20', refDate)).toBe(25);
  });

  it('calculates age correctly on the exact day of birth', () => {
    const refDate = new Date('2026-08-24');
    expect(calculateAge('2000-08-24', refDate)).toBe(26);
  });

  it('handles Date object input', () => {
    const refDate = new Date('2026-08-24');
    expect(calculateAge(new Date('1990-05-10'), refDate)).toBe(36);
  });

  it('ensures age is never negative', () => {
    const refDate = new Date('2026-08-24');
    expect(calculateAge('2030-01-01', refDate)).toBe(0);
  });
});

describe('calculateBMR', () => {
  it('calculates male BMR accurately using Mifflin-St Jeor formula', () => {
    // Male: (10 * 80) + (6.25 * 175) - (5 * 30) + 5 = 800 + 1093.75 - 150 + 5 = 1748.75 -> 1749
    const bmr = calculateBMR({ weightKg: 80, heightCm: 175, ageYears: 30, sex: 'MALE' });
    expect(bmr).toBe(1749);
  });

  it('calculates female BMR accurately using Mifflin-St Jeor formula', () => {
    // Female: (10 * 60) + (6.25 * 165) - (5 * 25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    const bmr = calculateBMR({ weightKg: 60, heightCm: 165, ageYears: 25, sex: 'FEMALE' });
    expect(bmr).toBe(1345);
  });

  it('calculates other/unspecified biological sex using average offset', () => {
    // Other: (10 * 70) + (6.25 * 170) - (5 * 28) - 78 = 700 + 1062.5 - 140 - 78 = 1544.5 -> 1545
    const bmr = calculateBMR({ weightKg: 70, heightCm: 170, ageYears: 28, sex: 'OTHER' });
    expect(bmr).toBe(1545);
  });

  it('returns 0 for non-positive physiological inputs', () => {
    expect(calculateBMR({ weightKg: 0, heightCm: 170, ageYears: 25, sex: 'MALE' })).toBe(0);
    expect(calculateBMR({ weightKg: 70, heightCm: -10, ageYears: 25, sex: 'MALE' })).toBe(0);
    expect(calculateBMR({ weightKg: 70, heightCm: 170, ageYears: -5, sex: 'MALE' })).toBe(0);
  });
});

describe('calculateTDEE', () => {
  it('applies SEDENTARY activity factor (1.2)', () => {
    expect(calculateTDEE({ bmr: 1500, activityLevel: 'SEDENTARY' })).toBe(1800);
  });

  it('applies LIGHTLY_ACTIVE activity factor (1.375)', () => {
    expect(calculateTDEE({ bmr: 1600, activityLevel: 'LIGHTLY_ACTIVE' })).toBe(2200);
  });

  it('applies MODERATELY_ACTIVE activity factor (1.55)', () => {
    expect(calculateTDEE({ bmr: 1600, activityLevel: 'MODERATELY_ACTIVE' })).toBe(2480);
  });

  it('applies VERY_ACTIVE activity factor (1.725)', () => {
    expect(calculateTDEE({ bmr: 1600, activityLevel: 'VERY_ACTIVE' })).toBe(2760);
  });

  it('applies EXTRA_ACTIVE activity factor (1.9)', () => {
    expect(calculateTDEE({ bmr: 1600, activityLevel: 'EXTRA_ACTIVE' })).toBe(3040);
  });

  it('falls back to MODERATELY_ACTIVE for unknown activity level', () => {
    expect(calculateTDEE({ bmr: 1600, activityLevel: 'UNKNOWN' })).toBe(2480);
  });

  it('returns 0 when bmr is non-positive', () => {
    expect(calculateTDEE({ bmr: 0, activityLevel: 'MODERATELY_ACTIVE' })).toBe(0);
  });
});

describe('calculateCalorieTarget', () => {
  it('applies standard 500 kcal deficit for WEIGHT_LOSS', () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'WEIGHT_LOSS' })).toBe(2000);
  });

  it('applies standard 250 kcal surplus for MUSCLE_GAIN', () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'MUSCLE_GAIN' })).toBe(2750);
  });

  it('returns maintenance TDEE for STRENGTH_TARGET, WORKOUT_FREQUENCY, or CUSTOM', () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'STRENGTH_TARGET' })).toBe(2500);
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'WORKOUT_FREQUENCY' })).toBe(2500);
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'CUSTOM' })).toBe(2500);
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'OTHER' })).toBe(2500);
  });

  it('enforces safety calorie floor of 1200 kcal', () => {
    expect(calculateCalorieTarget({ tdee: 1400, goalType: 'WEIGHT_LOSS' })).toBe(1200);
  });

  it('returns 0 when tdee is non-positive', () => {
    expect(calculateCalorieTarget({ tdee: 0, goalType: 'WEIGHT_LOSS' })).toBe(0);
  });
});
