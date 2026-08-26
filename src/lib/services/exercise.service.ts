import prisma from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import type { ExerciseCategory } from '@/types/database';

export interface ListExercisesParams {
  search?: string;
  category?: ExerciseCategory;
  muscleGroup?: string;
  limit?: number;
  cursor?: string;
}

export const INITIAL_SEED_EXERCISES = [
  // Chest
  {
    name: 'Barbell Bench Press',
    category: 'STRENGTH' as const,
    description: 'Compound upper-body pressing exercise targeting the pectoralis major.',
    instructions: [
      'Lie back on a flat bench.',
      'Grip the barbell slightly wider than shoulder-width.',
      'Lower the bar with control to your mid-chest.',
      'Press the bar back up until your arms are extended.',
    ],
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
  },
  {
    name: 'Incline Dumbbell Press',
    category: 'STRENGTH' as const,
    description: 'Incline pressing movement emphasizing the clavicular upper head of the chest.',
    instructions: [
      'Set an adjustable bench to 30–45 degrees.',
      'Hold a dumbbell in each hand at shoulder level.',
      'Press upward until arms are straight.',
      'Lower smoothly to upper chest height.',
    ],
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
  },
  {
    name: 'Cable Fly',
    category: 'STRENGTH' as const,
    description: 'Isolation exercise maintaining continuous tension across the chest adduction arc.',
    instructions: [
      'Set pulleys at chest height.',
      'Step forward slightly with one foot for stability.',
      'Bring handles together in a hugging motion with slight bend in elbows.',
      'Open arms back until chest is gently stretched.',
    ],
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders'],
  },
  {
    name: 'Chest Dip',
    category: 'STRENGTH' as const,
    description: 'Bodyweight pressing exercise focusing on the lower pectoral fibers and triceps.',
    instructions: [
      'Grasp parallel bars and support your body weight.',
      'Lean your torso slightly forward.',
      'Lower body until elbows reach 90 degrees.',
      'Push back up to the starting position.',
    ],
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
  },

  // Back
  {
    name: 'Pull-Up',
    category: 'STRENGTH' as const,
    description: 'Vertical pulling compound movement building latissimus dorsi and upper back width.',
    instructions: [
      'Grip pull-up bar with overhand grip wider than shoulders.',
      'Pull your chest up towards the bar by engaging your back.',
      'Pause briefly with chin over the bar.',
      'Lower under control to a full stretch.',
    ],
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Upper Back'],
  },
  {
    name: 'Barbell Bent-Over Row',
    category: 'STRENGTH' as const,
    description: 'Horizontal compound pull developing back thickness and spinal erectors.',
    instructions: [
      'Hinge at hips with knees slightly bent, back flat at 45 degrees.',
      'Pull barbell towards your lower ribcage.',
      'Squeeze shoulder blades together at the top.',
      'Lower bar with control.',
    ],
    primaryMuscle: 'Upper Back',
    secondaryMuscles: ['Lats', 'Biceps', 'Hamstrings'],
  },
  {
    name: 'Lat Pulldown',
    category: 'STRENGTH' as const,
    description: 'Cable-based vertical pulling movement targeting the latissimus dorsi.',
    instructions: [
      'Sit comfortably and adjust thigh pads.',
      'Grip the bar slightly wider than shoulder-width.',
      'Pull the bar down smoothly to your upper chest.',
      'Return slowly to the top starting position.',
    ],
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Upper Back'],
  },
  {
    name: 'Deadlift',
    category: 'STRENGTH' as const,
    description: 'Full-body posterior chain compound lift.',
    instructions: [
      'Stand with feet hip-width apart, barbell over mid-foot.',
      'Hinge hips back and grip bar outside legs.',
      'Drive through feet and extend hips to stand tall.',
      'Hinge back down with neutral spine.',
    ],
    primaryMuscle: 'Lower Back',
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Lats', 'Traps'],
  },

  // Shoulders
  {
    name: 'Overhead Press',
    category: 'STRENGTH' as const,
    description: 'Standing barbell overhead press for anterior deltoid and shoulder girdle power.',
    instructions: [
      'Rest barbell on clavicle with shoulder-width grip.',
      'Brace core and press the bar straight overhead.',
      'Lock out with head through the window.',
      'Lower bar carefully back to clavicle.',
    ],
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
  },
  {
    name: 'Dumbbell Lateral Raise',
    category: 'STRENGTH' as const,
    description: 'Isolation exercise targeting lateral deltoids for shoulder width.',
    instructions: [
      'Stand holding dumbbells at sides.',
      'Raise arms out to sides with slight elbow bend until parallel to floor.',
      'Pause for a split second at top.',
      'Lower dumbbells slowly to thighs.',
    ],
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Traps'],
  },
  {
    name: 'Face Pull',
    category: 'STRENGTH' as const,
    description: 'Cable movement for posterior deltoids and rotator cuff health.',
    instructions: [
      'Attach rope to high cable pulley.',
      'Pull rope towards your face, separating ends of the rope.',
      'Externally rotate shoulders at the end of the pull.',
      'Control the return to start.',
    ],
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Upper Back', 'Traps'],
  },

  // Legs
  {
    name: 'Barbell Back Squat',
    category: 'STRENGTH' as const,
    description: 'The premier lower body compound movement targeting quads, glutes, and core.',
    instructions: [
      'Place bar on upper traps, feet shoulder-width apart.',
      'Sit back and down into squat until thighs are parallel to ground.',
      'Drive through mid-foot to stand up.',
    ],
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves', 'Core'],
  },
  {
    name: 'Romanian Deadlift',
    category: 'STRENGTH' as const,
    description: 'Hip hinge movement emphasizing hamstring and glute hypertrophy.',
    instructions: [
      'Hold barbell at hip height with soft knees.',
      'Hinge hips backwards while lowering bar along shins.',
      'Feel deep hamstring stretch, then drive hips forward to stand.',
    ],
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back'],
  },
  {
    name: 'Leg Press',
    category: 'STRENGTH' as const,
    description: 'Machine-based compound leg exercise allowing heavy quad and glute loading.',
    instructions: [
      'Position feet shoulder-width on footplate.',
      'Lower sled until knees reach 90 degrees.',
      'Press sled back up without locking knees aggressively.',
    ],
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
  },

  // Arms
  {
    name: 'Barbell Bicep Curl',
    category: 'STRENGTH' as const,
    description: 'Classic bicep builder targeting long and short heads.',
    instructions: [
      'Hold barbell with underhand shoulder-width grip.',
      'Curl bar towards shoulders without swinging elbows.',
      'Squeeze biceps at peak contraction, then lower slowly.',
    ],
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
  },
  {
    name: 'Tricep Rope Pushdown',
    category: 'STRENGTH' as const,
    description: 'Cable isolation movement targeting lateral and medial tricep heads.',
    instructions: [
      'Attach rope to upper pulley.',
      'Pin elbows to sides and push rope down.',
      'Spread rope ends apart at bottom for full lockout.',
      'Allow forearms to rise back up under control.',
    ],
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Forearms'],
  },
  {
    name: 'Hammer Curl',
    category: 'STRENGTH' as const,
    description: 'Neutral-grip dumbbell curl targeting brachialis and brachioradialis.',
    instructions: [
      'Hold dumbbells with palms facing each other.',
      'Curl dumbbells upward keeping palms facing inward.',
      'Lower smoothly under control.',
    ],
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
  },
  {
    name: 'Skull Crusher (Lying Tricep Extension)',
    category: 'STRENGTH' as const,
    description: 'Tricep extension targeting the long head of the triceps.',
    instructions: [
      'Lie on flat bench holding EZ-bar or dumbbells above chest.',
      'Bend elbows to lower weight towards forehead.',
      'Extend elbows back to starting position.',
    ],
    primaryMuscle: 'Triceps',
    secondaryMuscles: [],
  },

  // Core
  {
    name: 'Hanging Leg Raise',
    category: 'STRENGTH' as const,
    description: 'Dynamic core exercise targeting lower rectus abdominis and hip flexors.',
    instructions: [
      'Hang from pull-up bar with arms extended.',
      'Raise legs straight or bent up to 90 degrees.',
      'Lower legs without swinging.',
    ],
    primaryMuscle: 'Abs',
    secondaryMuscles: ['Hip Flexors'],
  },
  {
    name: 'Plank',
    category: 'STRENGTH' as const,
    description: 'Isometric core stability and anti-extension exercise.',
    instructions: [
      'Support body on forearms and toes.',
      'Maintain straight line from head to heels.',
      'Brace core and hold position for target duration.',
    ],
    primaryMuscle: 'Abs',
    secondaryMuscles: ['Shoulders', 'Glutes', 'Lower Back'],
  },
];

export class ExerciseService {
  /**
   * Seeds foundational exercises and muscle groups into the database if not yet populated.
   */
  static async seedInitialExercises(): Promise<number> {
    const existingCount = await prisma.exercise.count();
    if (existingCount >= INITIAL_SEED_EXERCISES.length) {
      return existingCount;
    }

    let createdCount = 0;

    for (const ex of INITIAL_SEED_EXERCISES) {
      const existing = await prisma.exercise.findFirst({
        where: { name: ex.name },
      });

      if (!existing) {
        // Find or create primary muscle group
        let primaryMg = await prisma.muscleGroup.findUnique({
          where: { name: ex.primaryMuscle },
        });

        if (!primaryMg) {
          primaryMg = await prisma.muscleGroup.create({
            data: {
              name: ex.primaryMuscle,
              bodyPart: ex.primaryMuscle,
            },
          });
        }

        // Create exercise with primary muscle relation
        await prisma.exercise.create({
          data: {
            name: ex.name,
            category: ex.category,
            description: ex.description,
            instructions: ex.instructions,
            isCustom: false,
            muscles: {
              create: {
                muscleGroupId: primaryMg.id,
                isPrimary: true,
              },
            },
          },
        });
        createdCount++;
      }
    }

    return createdCount;
  }

  /**
   * Lists exercises with optional filtering, search, and pagination.
   */
  static async listExercises(params: ListExercisesParams = {}) {
    const { search, category, muscleGroup, limit = 50, cursor } = params;

    // Ensure initial exercises are available
    const count = await prisma.exercise.count();
    if (count === 0) {
      await this.seedInitialExercises();
    }

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.category = category;
    }

    if (muscleGroup) {
      where.muscles = {
        some: {
          muscleGroup: {
            name: {
              equals: muscleGroup,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { name: 'asc' },
      include: {
        muscles: {
          include: {
            muscleGroup: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (exercises.length > limit) {
      const nextItem = exercises.pop();
      nextCursor = nextItem?.id;
    }

    return {
      exercises: exercises.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        description: e.description,
        instructions: e.instructions,
        imageUrl: e.imageUrl,
        videoUrl: e.videoUrl,
        isCustom: e.isCustom,
        primaryMuscle: e.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
        muscles: e.muscles.map((m) => ({
          name: m.muscleGroup.name,
          isPrimary: m.isPrimary,
        })),
      })),
      nextCursor,
    };
  }

  /**
   * Retrieves a single exercise by ID.
   */
  static async getExerciseById(id: string) {
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        muscles: {
          include: {
            muscleGroup: true,
          },
        },
      },
    });

    if (!exercise) {
      throw AppError.notFound('Exercise not found.');
    }

    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      description: exercise.description,
      instructions: exercise.instructions,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      isCustom: exercise.isCustom,
      primaryMuscle: exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
      muscles: exercise.muscles.map((m) => ({
        name: m.muscleGroup.name,
        isPrimary: m.isPrimary,
      })),
    };
  }

  /**
   * Creates a user-defined custom exercise with muscle group associations.
   */
  static async createCustomExercise(
    userId: string,
    input: {
      name: string;
      category?: ExerciseCategory;
      primaryMuscle: string;
      secondaryMuscles?: string[];
      description?: string | null;
      instructions?: string[];
      videoUrl?: string | null;
      imageUrl?: string | null;
    }
  ) {
    if (!userId) {
      throw AppError.unauthorized('User session required.');
    }

    const {
      name,
      category = 'STRENGTH',
      primaryMuscle,
      secondaryMuscles = [],
      description,
      instructions = [],
      videoUrl,
      imageUrl,
    } = input;

    // 1. Find or create primary muscle group
    let primaryMg = await prisma.muscleGroup.findFirst({
      where: { name: { equals: primaryMuscle, mode: 'insensitive' } },
    });

    if (!primaryMg) {
      primaryMg = await prisma.muscleGroup.create({
        data: {
          name: primaryMuscle,
          bodyPart: primaryMuscle,
        },
      });
    }

    // 2. Prepare secondary muscle group relations
    const secondaryMuscleGroupIds: string[] = [];
    for (const secMuscle of secondaryMuscles) {
      if (!secMuscle.trim() || secMuscle.toLowerCase() === primaryMuscle.toLowerCase()) continue;
      let secMg = await prisma.muscleGroup.findFirst({
        where: { name: { equals: secMuscle.trim(), mode: 'insensitive' } },
      });
      if (!secMg) {
        secMg = await prisma.muscleGroup.create({
          data: {
            name: secMuscle.trim(),
            bodyPart: secMuscle.trim(),
          },
        });
      }
      secondaryMuscleGroupIds.push(secMg.id);
    }

    // 3. Create exercise
    const created = await prisma.exercise.create({
      data: {
        name: name.trim(),
        category,
        description: description?.trim() || null,
        instructions: instructions.filter((i) => i.trim().length > 0),
        isCustom: true,
        videoUrl: videoUrl?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        muscles: {
          create: [
            {
              muscleGroupId: primaryMg.id,
              isPrimary: true,
            },
            ...secondaryMuscleGroupIds.map((mgId) => ({
              muscleGroupId: mgId,
              isPrimary: false,
            })),
          ],
        },
      },
      include: {
        muscles: {
          include: {
            muscleGroup: true,
          },
        },
      },
    });

    return {
      id: created.id,
      name: created.name,
      category: created.category,
      description: created.description,
      instructions: created.instructions,
      imageUrl: created.imageUrl,
      videoUrl: created.videoUrl,
      isCustom: created.isCustom,
      primaryMuscle: created.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? primaryMuscle,
      muscles: created.muscles.map((m) => ({
        name: m.muscleGroup.name,
        isPrimary: m.isPrimary,
      })),
    };
  }
}
