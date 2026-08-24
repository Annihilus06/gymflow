/**
 * Canonical muscle group names and anatomical body part categories.
 */
export const MUSCLE_GROUPS = [
  { name: 'Chest', bodyPart: 'Upper Body' },
  { name: 'Upper Back', bodyPart: 'Upper Body' },
  { name: 'Lats', bodyPart: 'Upper Body' },
  { name: 'Shoulders', bodyPart: 'Upper Body' },
  { name: 'Biceps', bodyPart: 'Arms' },
  { name: 'Triceps', bodyPart: 'Arms' },
  { name: 'Forearms', bodyPart: 'Arms' },
  { name: 'Quadriceps', bodyPart: 'Lower Body' },
  { name: 'Hamstrings', bodyPart: 'Lower Body' },
  { name: 'Glutes', bodyPart: 'Lower Body' },
  { name: 'Calves', bodyPart: 'Lower Body' },
  { name: 'Core / Abs', bodyPart: 'Core' },
  { name: 'Lower Back', bodyPart: 'Core' },
  { name: 'Traps', bodyPart: 'Upper Body' },
] as const;

export type MuscleGroupName = (typeof MUSCLE_GROUPS)[number]['name'];
