import { describe, it, expect } from 'vitest';
import { calculateBMI, getBMICategory } from '@/lib/utils/bmi';

describe('calculateBMI', () => {
  it('returns correct BMI for standard values', () => {
    // 70kg, 175cm -> 70 / (1.75^2) = 22.86
    expect(calculateBMI(70, 175)).toBeCloseTo(22.86, 2);
  });

  it('handles edge case: height = 0 returns null', () => {
    expect(calculateBMI(70, 0)).toBeNull();
  });

  it('handles edge case: weight = 0 returns null', () => {
    expect(calculateBMI(0, 175)).toBeNull();
  });

  it('handles negative height or weight by returning null', () => {
    expect(calculateBMI(-70, 175)).toBeNull();
    expect(calculateBMI(70, -175)).toBeNull();
  });

  it('handles non-finite / NaN values safely', () => {
    expect(calculateBMI(NaN, 175)).toBeNull();
    expect(calculateBMI(70, NaN)).toBeNull();
    expect(calculateBMI(Infinity, 175)).toBeNull();
  });
});

describe('getBMICategory', () => {
  it('classifies underweight category (< 18.5)', () => {
    expect(getBMICategory(17.2)).toBe('Underweight');
    expect(getBMICategory(18.4)).toBe('Underweight');
  });

  it('classifies normal weight category (18.5 - 24.9)', () => {
    expect(getBMICategory(18.5)).toBe('Normal weight');
    expect(getBMICategory(22.0)).toBe('Normal weight');
    expect(getBMICategory(24.9)).toBe('Normal weight');
  });

  it('classifies overweight category (25.0 - 29.9)', () => {
    expect(getBMICategory(25.0)).toBe('Overweight');
    expect(getBMICategory(27.5)).toBe('Overweight');
    expect(getBMICategory(29.9)).toBe('Overweight');
  });

  it('classifies obese category (>= 30.0)', () => {
    expect(getBMICategory(30.0)).toBe('Obese');
    expect(getBMICategory(35.5)).toBe('Obese');
  });
});
