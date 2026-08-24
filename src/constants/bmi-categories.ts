/**
 * Standard World Health Organization (WHO) BMI classification thresholds and labels.
 */
export const BMI_THRESHOLDS = {
  UNDERWEIGHT: 18.5,
  NORMAL_MAX: 24.9,
  OVERWEIGHT_MAX: 29.9,
} as const;

export const BMI_CATEGORIES = {
  UNDERWEIGHT: 'Underweight',
  NORMAL: 'Normal weight',
  OVERWEIGHT: 'Overweight',
  OBESE: 'Obese',
} as const;

export type BMICategory = (typeof BMI_CATEGORIES)[keyof typeof BMI_CATEGORIES];
