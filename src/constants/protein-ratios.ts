/**
 * Recommended daily protein intake per kilogram of body weight (g/kg).
 * Tailored by primary fitness goal according to sports nutrition guidelines.
 */
export const PROTEIN_RATIOS = {
  WEIGHT_LOSS: 2.2, // High protein to preserve lean muscle during calorie deficit
  MUSCLE_GAIN: 2.0, // Optimal for hypertrophy and muscle protein synthesis
  STRENGTH_TARGET: 1.8, // Strength and power adaptation
  WORKOUT_FREQUENCY: 1.6, // General fitness maintenance
  CUSTOM: 1.8,
} as const;

export type ProteinRatioKey = keyof typeof PROTEIN_RATIOS;
