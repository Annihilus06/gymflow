import type { GoalType } from '@/types/database';

export type GoalTrackStatus = 'ON_TRACK' | 'BEHIND' | 'COMPLETED' | 'NEEDS_ATTENTION';

/**
 * Deterministically computes goal completion percentage (0 - 100) based on start, current, and target values.
 * Strictly coded without AI calculation (RULE-AI-001).
 *
 * @param startValue - Initial value at goal creation
 * @param currentValue - Current measured progress value
 * @param targetValue - Desired target value
 * @param _type - Optional goal type identifier
 * @returns Progress percentage strictly bounded between 0 and 100
 */
export function computeGoalProgress(
  startValue?: number | null,
  currentValue?: number | null,
  targetValue?: number | null,
  _type?: GoalType | string | null
): number {
  if (
    startValue === null ||
    startValue === undefined ||
    currentValue === null ||
    currentValue === undefined ||
    targetValue === null ||
    targetValue === undefined
  ) {
    return 0;
  }

  if (isNaN(startValue) || isNaN(currentValue) || isNaN(targetValue)) {
    return 0;
  }

  // If start equals target, reaching or passing target is 100%
  if (startValue === targetValue) {
    return currentValue >= targetValue ? 100 : 0;
  }

  let progress = 0;

  if (targetValue > startValue) {
    // Increasing goal (e.g. Muscle Gain, Strength, Workout Count, Running Distance)
    progress = ((currentValue - startValue) / (targetValue - startValue)) * 100;
  } else {
    // Decreasing goal (e.g. Weight Loss)
    progress = ((startValue - currentValue) / (startValue - targetValue)) * 100;
  }

  // Bound between 0 and 100
  if (progress < 0) return 0;
  if (progress > 100) return 100;

  return Math.round(progress * 10) / 10;
}

/**
 * Calculates days remaining until target deadline.
 */
export function calculateDaysRemaining(
  targetDate?: Date | string | null,
  referenceDate = new Date()
): number {
  if (!targetDate) return 0;

  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  if (isNaN(target.getTime())) return 0;

  const diffMs = target.getTime() - referenceDate.getTime();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Derives on-track / behind tracking status comparing elapsed time against progress.
 */
export function deriveGoalTrackStatus(
  startDate: Date | string,
  targetDate: Date | string,
  progressPct: number,
  referenceDate = new Date()
): GoalTrackStatus {
  if (progressPct >= 100) {
    return 'COMPLETED';
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  if (isNaN(start.getTime()) || isNaN(target.getTime())) {
    return 'ON_TRACK';
  }

  const totalDuration = target.getTime() - start.getTime();
  if (totalDuration <= 0) {
    return progressPct >= 100 ? 'COMPLETED' : 'BEHIND';
  }

  const elapsed = referenceDate.getTime() - start.getTime();
  if (elapsed <= 0) {
    return 'ON_TRACK';
  }

  const timeElapsedPct = (elapsed / totalDuration) * 100;

  // If past deadline and not 100%
  if (timeElapsedPct >= 100) {
    return 'BEHIND';
  }

  // Within 10% buffer of expected progress
  if (progressPct >= timeElapsedPct - 10) {
    return 'ON_TRACK';
  }

  return 'BEHIND';
}

/**
 * Returns default display unit for a given GoalType.
 */
export function getGoalUnit(type: GoalType | string): string {
  switch (type) {
    case 'WEIGHT_LOSS':
    case 'MUSCLE_GAIN':
    case 'STRENGTH_TARGET':
      return 'kg';
    case 'WORKOUT_FREQUENCY':
      return 'workouts';
    default:
      return 'units';
  }
}
