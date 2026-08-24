import { describe, it, expect } from 'vitest';
import {
  kgToLb,
  lbToKg,
  formatWeight,
  cmToInches,
  inchesToCm,
  formatHeight,
} from '@/lib/utils/units';

describe('Unit Conversion Utilities', () => {
  it('converts kg to lb accurately', () => {
    // 70 kg * 2.20462 = 154.32 -> 154.3 lb
    expect(kgToLb(70)).toBe(154.3);
  });

  it('converts lb to kg accurately', () => {
    // 154.3 lb / 2.20462 = 69.98 -> 70.0 kg
    expect(lbToKg(154.3)).toBe(70);
  });

  it('formats weight in KG by default and when explicitly requested', () => {
    expect(formatWeight(75.45)).toBe('75.5 kg');
    expect(formatWeight(80, 'KG')).toBe('80 kg');
  });

  it('formats weight in LB when user preference is LB', () => {
    expect(formatWeight(70, 'LB')).toBe('154.3 lb');
  });

  it('converts cm to inches accurately', () => {
    // 180 cm * 0.393701 = 70.866 -> 70.9 inches
    expect(cmToInches(180)).toBe(70.9);
  });

  it('converts inches to cm accurately', () => {
    // 70.9 inches / 0.393701 = 180.08 -> 180.1 cm
    expect(inchesToCm(70.9)).toBe(180.1);
  });

  it('formats height in cm for display', () => {
    expect(formatHeight(175.4)).toBe('175 cm');
  });
});
