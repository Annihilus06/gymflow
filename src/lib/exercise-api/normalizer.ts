import type { ExerciseCategory } from '@/types/database';

export interface ExternalRawExercise {
  id?: string | number;
  name: string;
  category?: string;
  target?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  difficulty?: string;
  instructions?: string[] | string;
  description?: string;
  gifUrl?: string | null;
  videoUrl?: string | null;
  author?: string;
  attribution?: string;
}

export interface NormalizedExercise {
  externalId: string;
  name: string;
  description: string | null;
  instructions: string[];
  category: ExerciseCategory;
  equipment: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  imageUrl: string | null;
  videoUrl: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  attribution: string;
  confidenceScore: number;
}

const MUSCLE_MAPPINGS: Record<string, string> = {
  // Chest
  chest: 'Chest',
  pectorals: 'Chest',
  'pectoralis major': 'Chest',
  'pectoralis minor': 'Chest',
  'upper chest': 'Chest',
  'lower chest': 'Chest',

  // Back
  lats: 'Lats',
  latissimus: 'Lats',
  'latissimus dorsi': 'Lats',
  'upper back': 'Upper Back',
  traps: 'Traps',
  trapezius: 'Traps',
  rhomboids: 'Upper Back',
  'lower back': 'Lower Back',
  'erector spinae': 'Lower Back',
  spine: 'Lower Back',

  // Shoulders
  shoulders: 'Shoulders',
  delts: 'Shoulders',
  deltoids: 'Shoulders',
  'anterior deltoid': 'Shoulders',
  'lateral deltoid': 'Shoulders',
  'posterior deltoid': 'Shoulders',

  // Legs
  quads: 'Quads',
  quadriceps: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  'gluteus maximus': 'Glutes',
  calves: 'Calves',
  gastrocnemius: 'Calves',
  soleus: 'Calves',
  thighs: 'Quads',

  // Arms
  biceps: 'Biceps',
  'biceps brachii': 'Biceps',
  brachialis: 'Biceps',
  triceps: 'Triceps',
  'triceps brachii': 'Triceps',
  forearms: 'Forearms',
  wrists: 'Forearms',

  // Core
  abs: 'Abs',
  abdominals: 'Abs',
  'rectus abdominis': 'Abs',
  obliques: 'Abs',
  core: 'Abs',
};

const EQUIPMENT_MAPPINGS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  'body weight': 'Bodyweight',
  none: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Resistance Band',
  'resistance band': 'Resistance Band',
  smith: 'Smith Machine',
  ez_bar: 'EZ Bar',
  'ez barbell': 'EZ Bar',
};

const DIFFICULTY_MAPPINGS: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
  beginner: 'BEGINNER',
  novice: 'BEGINNER',
  easy: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  medium: 'INTERMEDIATE',
  moderate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  expert: 'ADVANCED',
  hard: 'ADVANCED',
};

/**
 * Normalizes muscle names into standard GymFlow muscle group categories.
 */
export function normalizeMuscleName(rawMuscle?: string | null): string {
  if (!rawMuscle) return 'Full Body';
  const cleaned = rawMuscle.trim().toLowerCase();
  return MUSCLE_MAPPINGS[cleaned] || rawMuscle.charAt(0).toUpperCase() + rawMuscle.slice(1);
}

/**
 * Normalizes equipment names into standard GymFlow equipment labels.
 */
export function normalizeEquipment(rawEquipment?: string | null): string {
  if (!rawEquipment) return 'Bodyweight';
  const cleaned = rawEquipment.trim().toLowerCase();
  return EQUIPMENT_MAPPINGS[cleaned] || rawEquipment.charAt(0).toUpperCase() + rawEquipment.slice(1);
}

/**
 * Normalizes difficulty ratings into standard enum values.
 */
export function normalizeDifficulty(
  rawDifficulty?: string | null
): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
  if (!rawDifficulty) return 'INTERMEDIATE';
  const cleaned = rawDifficulty.trim().toLowerCase();
  return DIFFICULTY_MAPPINGS[cleaned] || 'INTERMEDIATE';
}

/**
 * Calculates a string similarity match score (0.0 - 1.0) between query and target exercise name.
 */
export function calculateMatchConfidence(query: string, targetName: string): number {
  const q = query.trim().toLowerCase();
  const t = targetName.trim().toLowerCase();

  if (q === t) return 1.0;
  if (t.includes(q)) return 0.85;

  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  const matchingWords = qWords.filter((w) => tWords.includes(w));

  if (qWords.length === 0) return 0;
  return matchingWords.length / qWords.length;
}

/**
 * Normalizes raw external exercise data into safe, validated GymFlow domain structure.
 */
export function normalizeExternalExercise(
  raw: ExternalRawExercise,
  searchQuery?: string
): NormalizedExercise {
  const externalId = String(raw.id || `ext_${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  const name = raw.name.trim();

  // Normalize instructions
  let instructions: string[] = [];
  if (Array.isArray(raw.instructions)) {
    instructions = raw.instructions.map((s) => s.trim()).filter(Boolean);
  } else if (typeof raw.instructions === 'string') {
    instructions = raw.instructions
      .split(/\n|\. /)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
  }

  // Determine primary and secondary muscles
  const primaryMuscles: string[] = [];
  if (raw.primaryMuscles && raw.primaryMuscles.length > 0) {
    primaryMuscles.push(...raw.primaryMuscles.map((m) => normalizeMuscleName(m)));
  } else if (raw.target) {
    primaryMuscles.push(normalizeMuscleName(raw.target));
  } else {
    primaryMuscles.push('Full Body');
  }

  const secondaryMuscles: string[] = [];
  if (raw.secondaryMuscles && raw.secondaryMuscles.length > 0) {
    secondaryMuscles.push(...raw.secondaryMuscles.map((m) => normalizeMuscleName(m)));
  }

  const equipment = normalizeEquipment(raw.equipment);
  const difficulty = normalizeDifficulty(raw.difficulty);

  const confidenceScore = searchQuery ? calculateMatchConfidence(searchQuery, name) : 1.0;

  return {
    externalId,
    name,
    description: raw.description?.trim() || `Instructions and mechanics for ${name}.`,
    instructions: instructions.length > 0 ? instructions : [`Perform ${name} with proper form.`],
    category: 'STRENGTH',
    equipment,
    difficulty,
    imageUrl: raw.gifUrl || null,
    videoUrl: raw.videoUrl || null,
    primaryMuscles: Array.from(new Set(primaryMuscles)),
    secondaryMuscles: Array.from(new Set(secondaryMuscles)).filter(
      (m) => !primaryMuscles.includes(m)
    ),
    attribution: raw.attribution || 'Data provided via MuscleWiki / ExerciseDB API with attribution.',
    confidenceScore,
  };
}
