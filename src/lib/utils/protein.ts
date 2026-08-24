import { PROTEIN_RATIOS, type ProteinRatioKey } from '@/constants/protein-ratios';
import type { GoalType } from '@/types/database';

export interface ProteinTargetParams {
  weightKg: number;
  goalType: GoalType | string;
}

/**
 * Calculates recommended daily protein target (in grams) based on body weight and primary fitness goal.
 *
 * @param params - Body weight in kg and primary goal type
 * @returns Recommended daily protein in grams rounded to nearest integer
 */
export function calculateProteinTarget(params: ProteinTargetParams): number {
  const { weightKg, goalType } = params;

  if (weightKg <= 0) {
    return 0;
  }

  const ratio = PROTEIN_RATIOS[goalType as ProteinRatioKey] ?? PROTEIN_RATIOS.CUSTOM;
  return Math.round(weightKg * ratio);
}
