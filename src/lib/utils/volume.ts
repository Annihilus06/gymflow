export interface SetVolumeInput {
  actualReps?: number | null;
  reps?: number | null;
  weightKg?: number | null;
}

/**
 * Calculates volume (kg) for a single set: reps * weight.
 * Strictly deterministic without AI (RULE-AI-001).
 */
export function calculateSetVolume(reps?: number | null, weightKg?: number | null): number {
  const r = reps ?? 0;
  const w = weightKg ?? 0;

  if (isNaN(r) || isNaN(w) || r <= 0 || w <= 0) {
    return 0;
  }

  return Math.round(r * w * 10) / 10;
}

/**
 * Calculates total volume lifted across an array of sets.
 *
 * @param sets - Array of set records with reps and weight
 * @returns Total volume in kilograms
 */
export function calculateVolume(sets?: SetVolumeInput[] | null): number {
  if (!sets || !Array.isArray(sets) || sets.length === 0) {
    return 0;
  }

  const total = sets.reduce((sum, s) => {
    const r = s.actualReps ?? s.reps ?? 0;
    const w = s.weightKg ?? 0;
    return sum + calculateSetVolume(r, w);
  }, 0);

  return Math.round(total * 10) / 10;
}

/**
 * Formats volume for UI presentation with thousand separators.
 */
export function formatVolume(
  volumeKg?: number | null,
  unit = 'kg'
): { value: number; unit: string; display: string } {
  const v = volumeKg && !isNaN(volumeKg) ? Math.round(volumeKg) : 0;
  return {
    value: v,
    unit,
    display: `${v.toLocaleString()} ${unit}`,
  };
}
