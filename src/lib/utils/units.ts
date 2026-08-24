import type { WeightUnit } from '@/types/database';

const KG_TO_LB = 2.20462;
const CM_TO_INCH = 0.393701;

/**
 * Converts kg to lb.
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

/**
 * Converts lb to kg.
 */
export function lbToKg(lb: number): number {
  return Math.round((lb / KG_TO_LB) * 10) / 10;
}

/**
 * Formats a weight in kg into the user's preferred display unit (KG or LB).
 */
export function formatWeight(kg: number, unit: WeightUnit | 'KG' | 'LB' = 'KG'): string {
  if (unit === 'LB') {
    return `${kgToLb(kg)} lb`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}

/**
 * Converts cm to inches.
 */
export function cmToInches(cm: number): number {
  return Math.round(cm * CM_TO_INCH * 10) / 10;
}

/**
 * Converts inches to cm.
 */
export function inchesToCm(inches: number): number {
  return Math.round((inches / CM_TO_INCH) * 10) / 10;
}

/**
 * Formats a height in cm for display.
 */
export function formatHeight(cm: number): string {
  return `${Math.round(cm)} cm`;
}
