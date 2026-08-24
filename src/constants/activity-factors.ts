/**
 * Physical Activity Level multipliers for Total Daily Energy Expenditure (TDEE) calculation.
 * Based on the Mifflin-St Jeor equation standards.
 */
export const ACTIVITY_FACTORS = {
  SEDENTARY: 1.2, // Little or no exercise
  LIGHTLY_ACTIVE: 1.375, // Light exercise 1-3 days/week
  MODERATELY_ACTIVE: 1.55, // Moderate exercise 3-5 days/week
  VERY_ACTIVE: 1.725, // Hard exercise 6-7 days/week
  EXTRA_ACTIVE: 1.9, // Very hard exercise & physical job
} as const;

export type ActivityLevelKey = keyof typeof ACTIVITY_FACTORS;

/**
 * Calorie adjustment deltas based on user fitness goals (in kcal/day).
 */
export const GOAL_CALORIE_ADJUSTMENTS = {
  WEIGHT_LOSS: -500, // Standard moderate deficit (~0.5 kg/week)
  MUSCLE_GAIN: 250, // Lean bulking surplus
  STRENGTH_TARGET: 0, // Maintenance with high protein
  WORKOUT_FREQUENCY: 0, // Maintenance
  CUSTOM: 0,
} as const;
