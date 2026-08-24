import {
  ACTIVITY_FACTORS,
  GOAL_CALORIE_ADJUSTMENTS,
  type ActivityLevelKey,
} from '@/constants/activity-factors';
import type { Sex, GoalType } from '@/types/database';

export interface BMRParams {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex | 'MALE' | 'FEMALE' | 'OTHER';
}

export interface TDEEParams {
  bmr: number;
  activityLevel: ActivityLevelKey | string;
}

export interface CalorieTargetParams {
  tdee: number;
  goalType: GoalType | string;
}

/**
 * Calculates exact age in full years from a date of birth.
 *
 * @param dateOfBirth - ISO string or Date object
 * @param referenceDate - Optional reference date for calculation (defaults to now)
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string | Date, referenceDate: Date = new Date()): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * Male formula: (10 * weight) + (6.25 * height) - (5 * age) + 5
 * Female formula: (10 * weight) + (6.25 * height) - (5 * age) - 161
 * Other/Neutral: Average of male and female: (10 * weight) + (6.25 * height) - (5 * age) - 78
 *
 * @param params - Weight (kg), height (cm), age (years), and biological sex
 * @returns BMR in kcal/day rounded to integer
 */
export function calculateBMR(params: BMRParams): number {
  const { weightKg, heightCm, ageYears, sex } = params;

  if (weightKg <= 0 || heightCm <= 0 || ageYears < 0) {
    return 0;
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;

  if (sex === 'MALE') {
    return Math.round(base + 5);
  }
  if (sex === 'FEMALE') {
    return Math.round(base - 161);
  }
  // For OTHER or unspecified, average offset is -78
  return Math.round(base - 78);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) by multiplying BMR with physical activity multiplier.
 *
 * @param params - BMR (kcal) and activity level enum key
 * @returns TDEE in kcal/day rounded to integer
 */
export function calculateTDEE(params: TDEEParams): number {
  const { bmr, activityLevel } = params;
  if (bmr <= 0) return 0;

  const multiplier =
    ACTIVITY_FACTORS[activityLevel as ActivityLevelKey] ?? ACTIVITY_FACTORS.MODERATELY_ACTIVE;

  return Math.round(bmr * multiplier);
}

/**
 * Computes daily target calorie intake based on TDEE and fitness goal (surplus / deficit).
 *
 * @param params - TDEE and goal type
 * @returns Calorie target in kcal/day rounded to integer (minimum 1200 kcal floor for safety)
 */
export function calculateCalorieTarget(params: CalorieTargetParams): number {
  const { tdee, goalType } = params;
  if (tdee <= 0) return 0;

  const adjustment =
    GOAL_CALORIE_ADJUSTMENTS[goalType as keyof typeof GOAL_CALORIE_ADJUSTMENTS] ?? 0;

  const target = tdee + adjustment;
  // Safety floor: 1200 kcal
  return Math.max(1200, Math.round(target));
}
