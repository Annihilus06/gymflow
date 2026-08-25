import { PrismaClient, GoalType, GoalStatus, SessionStatus, ExerciseCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GymFlow Preview Seed...');

  // 1. Seed Muscle Groups
  const muscleGroupsData = [
    { name: 'Chest', bodyPart: 'Chest' },
    { name: 'Back', bodyPart: 'Back' },
    { name: 'Shoulders', bodyPart: 'Shoulders' },
    { name: 'Legs', bodyPart: 'Legs' },
    { name: 'Arms', bodyPart: 'Arms' },
    { name: 'Core', bodyPart: 'Waist' },
  ];

  const muscleGroupMap: Record<string, string> = {};

  for (const mg of muscleGroupsData) {
    const record = await prisma.muscleGroup.upsert({
      where: { name: mg.name },
      update: {},
      create: mg,
    });
    muscleGroupMap[mg.name] = record.id;
  }

  // 2. Seed Standard Exercises
  const exercisesData = [
    // Chest
    {
      name: 'Barbell Bench Press',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Chest',
      instructions: ['Lie flat on bench, grip bar with hands slightly wider than shoulder-width.', 'Lower bar to mid-chest and press up powerfully.'],
    },
    {
      name: 'Incline Dumbbell Press',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Chest',
      instructions: ['Set bench to 30-45 degrees incline.', 'Press dumbbells upward with palms facing forward.'],
    },
    {
      name: 'Cable Fly',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Chest',
      instructions: ['Stand between pulleys with slight forward lean.', 'Bring handles together in an arc motion.'],
    },
    {
      name: 'Chest Dip',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Chest',
      instructions: ['Lean forward on parallel bars, lower until elbows are at 90 degrees, press up.'],
    },
    // Back
    {
      name: 'Barbell Row',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Back',
      instructions: ['Hinge at hips with flat back.', 'Pull bar toward lower ribs, squeezing shoulder blades.'],
    },
    {
      name: 'Pull-up',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Back',
      instructions: ['Hang with overhand grip wider than shoulders.', 'Pull chest up to bar.'],
    },
    {
      name: 'Lat Pulldown',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Back',
      instructions: ['Grip bar wide, pull down toward upper chest while driving elbows down.'],
    },
    {
      name: 'Seated Cable Row',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Back',
      instructions: ['Sit with knees slightly bent.', 'Pull handle into abdomen with straight spine.'],
    },
    // Shoulders
    {
      name: 'Overhead Press',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Shoulders',
      instructions: ['Stand tall with bar at collarbone.', 'Press bar vertically overhead, locking out.'],
    },
    {
      name: 'Dumbbell Lateral Raise',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Shoulders',
      instructions: ['Raise dumbbells to sides until arms are parallel to floor with slight elbow bend.'],
    },
    {
      name: 'Face Pull',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Shoulders',
      instructions: ['Attach rope to high cable.', 'Pull toward face while externally rotating shoulders.'],
    },
    // Legs
    {
      name: 'Barbell Squat',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Legs',
      instructions: ['Place bar across upper back.', 'Squat down until thighs are parallel to ground, stand back up.'],
    },
    {
      name: 'Romanian Deadlift',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Legs',
      instructions: ['Hinge at hips, lowering bar down shins while keeping back straight and hamstrings engaged.'],
    },
    {
      name: 'Leg Press',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Legs',
      instructions: ['Sit in machine with feet hip-width on sled.', 'Lower weight to 90 degrees and push up.'],
    },
    {
      name: 'Standing Calf Raise',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Legs',
      instructions: ['Stand on balls of feet.', 'Raise heels as high as possible, hold, and lower under control.'],
    },
    // Arms
    {
      name: 'Barbell Curl',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Arms',
      instructions: ['Stand holding barbell with underhand grip.', 'Curl bar toward chest without swinging.'],
    },
    {
      name: 'Tricep Pushdown',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Arms',
      instructions: ['Keep elbows tucked at sides.', 'Push cable attachment down until arms are fully extended.'],
    },
    {
      name: 'Hammer Curl',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Arms',
      instructions: ['Hold dumbbells with neutral palms-in grip.', 'Curl upward concentrating on forearms and biceps.'],
    },
    {
      name: 'Skull Crushers',
      category: ExerciseCategory.STRENGTH,
      primaryMuscle: 'Arms',
      instructions: ['Lie on flat bench.', 'Lower EZ bar toward forehead bending only at elbows, then extend.'],
    },
  ];

  const exerciseMap: Record<string, string> = {};

  for (const ex of exercisesData) {
    let record = await prisma.exercise.findFirst({
      where: { name: ex.name },
    });

    if (!record) {
      record = await prisma.exercise.create({
        data: {
          name: ex.name,
          category: ex.category,
          instructions: ex.instructions,
        },
      });
    }

    exerciseMap[ex.name] = record.id;

    // Link primary muscle
    const muscleGroupId = muscleGroupMap[ex.primaryMuscle];
    if (muscleGroupId) {
      await prisma.exerciseMuscle.upsert({
        where: {
          exerciseId_muscleGroupId: {
            exerciseId: record.id,
            muscleGroupId,
          },
        },
        update: {},
        create: {
          exerciseId: record.id,
          muscleGroupId,
          isPrimary: true,
        },
      });
    }
  }

  // 3. Demo User Setup (Development Only)
  const demoEmail = 'demo@gymflow.app';
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash: hashedPassword },
    create: {
      email: demoEmail,
      name: 'Alex Vance',
      passwordHash: hashedPassword,
    },
  });

  // 4. Demo User Profile
  await prisma.userProfile.upsert({
    where: { userId: demoUser.id },
    update: {
      heightCm: 180,
      sex: 'MALE',
      dateOfBirth: new Date('1996-08-24'),
      activityLevel: 'MODERATELY_ACTIVE',
      experienceLevel: 'INTERMEDIATE',
      onboardingComplete: true,
    },
    create: {
      userId: demoUser.id,
      heightCm: 180,
      sex: 'MALE',
      dateOfBirth: new Date('1996-08-24'),
      activityLevel: 'MODERATELY_ACTIVE',
      experienceLevel: 'INTERMEDIATE',
      onboardingComplete: true,
    },
  });

  // 5. Weight Logs
  await prisma.weightLog.deleteMany({ where: { userId: demoUser.id } });
  await prisma.weightLog.createMany({
    data: [
      { userId: demoUser.id, weightKg: 85.0, loggedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { userId: demoUser.id, weightKg: 83.5, loggedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      { userId: demoUser.id, weightKg: 82.5, loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  // 6. Active Goal
  await prisma.goal.deleteMany({ where: { userId: demoUser.id } });
  await prisma.goal.create({
    data: {
      userId: demoUser.id,
      title: 'Lose 5 kg for Summer',
      type: GoalType.WEIGHT_LOSS,
      status: GoalStatus.ACTIVE,
      startValue: 85.0,
      currentValue: 82.5,
      targetValue: 80.0,
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      description: 'Progressive training with moderate caloric deficit.',
    },
  });

  // 7. Weekly Routine: Monday Chest, Tuesday Back, Wed Rest, Thu Shoulders, Fri Legs, Sat Arms, Sun Rest
  await prisma.routine.deleteMany({ where: { userId: demoUser.id } });
  await prisma.routine.create({
    data: {
      userId: demoUser.id,
      name: '5-Day Hypertrophy & Strength Split',
      description: 'Optimal split balancing compound strength and hypertrophy.',
      isActive: true,
      days: {
        create: [
          // Monday: Chest
          {
            dayOfWeek: 'MONDAY',
            label: 'Chest Day',
            isRestDay: false,
            exercises: {
              create: [
                { exerciseId: exerciseMap['Barbell Bench Press']!, displayOrder: 0, defaultSets: 4, defaultReps: 8, defaultWeightKg: 80 },
                { exerciseId: exerciseMap['Incline Dumbbell Press']!, displayOrder: 1, defaultSets: 3, defaultReps: 10, defaultWeightKg: 28 },
                { exerciseId: exerciseMap['Cable Fly']!, displayOrder: 2, defaultSets: 3, defaultReps: 12, defaultWeightKg: 15 },
                { exerciseId: exerciseMap['Chest Dip']!, displayOrder: 3, defaultSets: 3, defaultReps: 10, defaultWeightKg: 0 },
              ],
            },
          },
          // Tuesday: Back
          {
            dayOfWeek: 'TUESDAY',
            label: 'Back Day',
            isRestDay: false,
            exercises: {
              create: [
                { exerciseId: exerciseMap['Barbell Row']!, displayOrder: 0, defaultSets: 4, defaultReps: 8, defaultWeightKg: 75 },
                { exerciseId: exerciseMap['Pull-up']!, displayOrder: 1, defaultSets: 3, defaultReps: 8, defaultWeightKg: 0 },
                { exerciseId: exerciseMap['Lat Pulldown']!, displayOrder: 2, defaultSets: 3, defaultReps: 10, defaultWeightKg: 65 },
                { exerciseId: exerciseMap['Seated Cable Row']!, displayOrder: 3, defaultSets: 3, defaultReps: 12, defaultWeightKg: 60 },
              ],
            },
          },
          // Wednesday: Rest
          {
            dayOfWeek: 'WEDNESDAY',
            label: 'Active Recovery',
            isRestDay: true,
          },
          // Thursday: Shoulders
          {
            dayOfWeek: 'THURSDAY',
            label: 'Shoulders Day',
            isRestDay: false,
            exercises: {
              create: [
                { exerciseId: exerciseMap['Overhead Press']!, displayOrder: 0, defaultSets: 4, defaultReps: 8, defaultWeightKg: 50 },
                { exerciseId: exerciseMap['Dumbbell Lateral Raise']!, displayOrder: 1, defaultSets: 4, defaultReps: 12, defaultWeightKg: 12 },
                { exerciseId: exerciseMap['Face Pull']!, displayOrder: 2, defaultSets: 3, defaultReps: 15, defaultWeightKg: 20 },
              ],
            },
          },
          // Friday: Legs
          {
            dayOfWeek: 'FRIDAY',
            label: 'Legs Day',
            isRestDay: false,
            exercises: {
              create: [
                { exerciseId: exerciseMap['Barbell Squat']!, displayOrder: 0, defaultSets: 4, defaultReps: 6, defaultWeightKg: 110 },
                { exerciseId: exerciseMap['Romanian Deadlift']!, displayOrder: 1, defaultSets: 3, defaultReps: 8, defaultWeightKg: 90 },
                { exerciseId: exerciseMap['Leg Press']!, displayOrder: 2, defaultSets: 3, defaultReps: 10, defaultWeightKg: 180 },
                { exerciseId: exerciseMap['Standing Calf Raise']!, displayOrder: 3, defaultSets: 4, defaultReps: 15, defaultWeightKg: 60 },
              ],
            },
          },
          // Saturday: Arms
          {
            dayOfWeek: 'SATURDAY',
            label: 'Arms Day',
            isRestDay: false,
            exercises: {
              create: [
                { exerciseId: exerciseMap['Barbell Curl']!, displayOrder: 0, defaultSets: 3, defaultReps: 10, defaultWeightKg: 35 },
                { exerciseId: exerciseMap['Tricep Pushdown']!, displayOrder: 1, defaultSets: 3, defaultReps: 12, defaultWeightKg: 30 },
                { exerciseId: exerciseMap['Hammer Curl']!, displayOrder: 2, defaultSets: 3, defaultReps: 10, defaultWeightKg: 16 },
                { exerciseId: exerciseMap['Skull Crushers']!, displayOrder: 3, defaultSets: 3, defaultReps: 10, defaultWeightKg: 30 },
              ],
            },
          },
          // Sunday: Rest
          {
            dayOfWeek: 'SUNDAY',
            label: 'Rest & Mobility',
            isRestDay: true,
          },
        ],
      },
    },
  });

  // 8. Completed Workout Sessions in the past week
  await prisma.workoutSession.deleteMany({ where: { userId: demoUser.id } });

  // Session 1: Monday Chest
  const benchExId = exerciseMap['Barbell Bench Press']!;
  await prisma.workoutSession.create({
    data: {
      userId: demoUser.id,
      status: SessionStatus.COMPLETED,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 48 * 60 * 1000),
      durationSecs: 2880,
      totalVolumeKg: 3200,
      notes: 'Strong bench press session.',
      exerciseLogs: {
        create: [
          {
            exerciseId: benchExId,
            displayOrder: 0,
            sets: {
              create: [
                { setNumber: 1, targetReps: 8, actualReps: 8, weightKg: 80, isPersonalRecord: true },
                { setNumber: 2, targetReps: 8, actualReps: 8, weightKg: 80, isPersonalRecord: false },
                { setNumber: 3, targetReps: 8, actualReps: 7, weightKg: 82.5, isPersonalRecord: true },
                { setNumber: 4, targetReps: 8, actualReps: 6, weightKg: 82.5, isPersonalRecord: false },
              ],
            },
          },
        ],
      },
    },
  });

  // 9. Meal Logs for Today
  await prisma.mealLog.deleteMany({ where: { userId: demoUser.id } });
  await prisma.mealLog.createMany({
    data: [
      {
        userId: demoUser.id,
        name: 'Oatmeal with Whey & Banana',
        estimatedCalories: 450,
        estimatedProteinG: 35,
        loggedAt: new Date(),
        notes: 'Breakfast',
      },
      {
        userId: demoUser.id,
        name: 'Grilled Chicken Breast, Brown Rice & Broccoli',
        estimatedCalories: 680,
        estimatedProteinG: 55,
        loggedAt: new Date(),
        notes: 'Lunch',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Demo User: ${demoEmail} / Password123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
