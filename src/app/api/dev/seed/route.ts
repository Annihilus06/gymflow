import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Forbidden in production' }, { status: 403 });
  }

  try {
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

    // 2. Demo User
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

    // 3. User Profile
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

    // 4. Weight Logs
    await prisma.weightLog.deleteMany({ where: { userId: demoUser.id } });
    await prisma.weightLog.createMany({
      data: [
        {
          userId: demoUser.id,
          weightKg: 85.0,
          loggedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          userId: demoUser.id,
          weightKg: 83.5,
          loggedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
        {
          userId: demoUser.id,
          weightKg: 82.5,
          loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // 5. Active Goal
    await prisma.goal.deleteMany({ where: { userId: demoUser.id } });
    await prisma.goal.create({
      data: {
        userId: demoUser.id,
        title: 'Lose 5 kg for Summer',
        type: 'WEIGHT_LOSS',
        status: 'ACTIVE',
        startValue: 85.0,
        currentValue: 82.5,
        targetValue: 80.0,
        startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        description: 'Progressive training with moderate caloric deficit.',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demo seed data successfully initialized!',
      demoUser: { email: demoEmail, password: 'Password123!' },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}
