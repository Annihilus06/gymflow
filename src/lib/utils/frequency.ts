/**
 * Calculates workout frequency completion percentage (0 - 100).
 * Strictly coded without AI calculation (RULE-AI-001).
 *
 * @param completedWorkouts - Number of verified completed workout sessions
 * @param plannedWorkouts - Number of scheduled workout days
 * @returns Bounded completion percentage (0 - 100)
 */
export function calculateFrequencyPercentage(
  completedWorkouts: number,
  plannedWorkouts: number
): number {
  if (isNaN(completedWorkouts) || isNaN(plannedWorkouts)) {
    return 0;
  }

  if (completedWorkouts <= 0) {
    return 0;
  }

  if (plannedWorkouts <= 0) {
    return 100;
  }

  const pct = (completedWorkouts / plannedWorkouts) * 100;

  if (pct > 100) return 100;
  if (pct < 0) return 0;

  return Math.round(pct * 10) / 10;
}

/**
 * Calculates consecutive workout day streak.
 *
 * @param completedDateStrings - Array of ISO date strings ('YYYY-MM-DD') with completed workouts
 * @param referenceDate - Today reference date
 * @returns Streak count (number of consecutive days/periods)
 */
export function calculateStreak(
  completedDateStrings: string[],
  referenceDate = new Date()
): number {
  if (!completedDateStrings || completedDateStrings.length === 0) {
    return 0;
  }

  const dateSet = new Set(completedDateStrings);

  // Format reference date to YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(referenceDate);

  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  let streak = 0;
  let checkDate = new Date(referenceDate);

  // If today has a completed workout, start counting from today.
  // Otherwise if yesterday has a completed workout, start counting from yesterday.
  if (dateSet.has(todayStr)) {
    checkDate = new Date(referenceDate);
  } else if (dateSet.has(yesterdayStr)) {
    checkDate = yesterday;
  } else {
    return 0;
  }

  while (dateSet.has(formatYMD(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calculates overall training consistency score (0 - 100).
 */
export function calculateConsistencyScore(frequencyPct: number, streak: number): number {
  if (isNaN(frequencyPct) || frequencyPct <= 0) return 0;

  const streakBonus = Math.min(streak * 5, 20); // Up to 20 bonus points for streak
  const score = Math.round(frequencyPct * 0.8 + streakBonus);

  if (score > 100) return 100;
  if (score < 0) return 0;
  return score;
}
