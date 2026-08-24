import { describe, it, expect } from 'vitest';
import { calculateProteinTarget } from '@/lib/utils/protein';

describe('calculateProteinTarget', () => {
  it('calculates 2.2 g/kg for WEIGHT_LOSS goal (muscle preservation during deficit)', () => {
    // 80kg * 2.2 = 176g
    expect(calculateProteinTarget({ weightKg: 80, goalType: 'WEIGHT_LOSS' })).toBe(176);
  });

  it('calculates 2.0 g/kg for MUSCLE_GAIN goal (optimal hypertrophy)', () => {
    // 75kg * 2.0 = 150g
    expect(calculateProteinTarget({ weightKg: 75, goalType: 'MUSCLE_GAIN' })).toBe(150);
  });

  it('calculates 1.8 g/kg for STRENGTH_TARGET goal', () => {
    // 80kg * 1.8 = 144g
    expect(calculateProteinTarget({ weightKg: 80, goalType: 'STRENGTH_TARGET' })).toBe(144);
  });

  it('calculates 1.6 g/kg for WORKOUT_FREQUENCY goal', () => {
    // 70kg * 1.6 = 112g
    expect(calculateProteinTarget({ weightKg: 70, goalType: 'WORKOUT_FREQUENCY' })).toBe(112);
  });

  it('calculates 1.8 g/kg for CUSTOM or unknown goal types', () => {
    // 70kg * 1.8 = 126g
    expect(calculateProteinTarget({ weightKg: 70, goalType: 'CUSTOM' })).toBe(126);
    expect(calculateProteinTarget({ weightKg: 70, goalType: 'UNKNOWN_GOAL' })).toBe(126);
  });

  it('returns 0 when body weight is non-positive', () => {
    expect(calculateProteinTarget({ weightKg: 0, goalType: 'MUSCLE_GAIN' })).toBe(0);
    expect(calculateProteinTarget({ weightKg: -10, goalType: 'WEIGHT_LOSS' })).toBe(0);
  });
});
