import { BMI_THRESHOLDS, BMI_CATEGORIES, type BMICategory } from '@/constants/bmi-categories';

/**
 * Calculates Body Mass Index (BMI) using standard formula: weight(kg) / (height(m))^2.
 *
 * @param weightKg - Body weight in kilograms
 * @param heightCm - Body height in centimeters
 * @returns BMI rounded to 2 decimal places, or null if inputs are non-positive or invalid.
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);

  if (!Number.isFinite(bmi) || Number.isNaN(bmi)) {
    return null;
  }

  return Math.round(bmi * 100) / 100;
}

/**
 * Determines the WHO BMI classification category for a given BMI value.
 *
 * @param bmi - Body Mass Index value
 * @returns WHO classification category string
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < BMI_THRESHOLDS.UNDERWEIGHT) {
    return BMI_CATEGORIES.UNDERWEIGHT;
  }
  if (bmi <= BMI_THRESHOLDS.NORMAL_MAX) {
    return BMI_CATEGORIES.NORMAL;
  }
  if (bmi <= BMI_THRESHOLDS.OVERWEIGHT_MAX) {
    return BMI_CATEGORIES.OVERWEIGHT;
  }
  return BMI_CATEGORIES.OBESE;
}
