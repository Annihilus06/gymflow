import prisma from '@/lib/db/prisma';
import { calculateBMI, getBMICategory } from '@/lib/utils/bmi';
import { calculateAge, calculateBMR, calculateTDEE, calculateCalorieTarget } from '@/lib/utils/calories';
import { calculateProteinTarget } from '@/lib/utils/protein';
import { AppError } from '@/lib/errors/app-error';
import type { OnboardingInput, UpdateProfileInput } from '@/lib/validations/profile.schema';
import type { UserProfile, GoalType } from '@/types/database';

export interface UserMetrics {
  currentWeightKg: number | null;
  bmi: number | null;
  bmiCategory: string | null;
  age: number | null;
  bmr: number | null;
  tdee: number | null;
  dailyCalorieTarget: number | null;
  dailyProteinTargetG: number | null;
}

export interface UserProfileResponse {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  profile: UserProfile | null;
  metrics: UserMetrics;
}

export class ProfileService {
  /**
   * Fetches user profile data and computes deterministic health & nutrition metrics.
   */
  static async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        weightLogs: { orderBy: { loggedAt: 'desc' }, take: 1 },
        goals: { where: { status: 'ACTIVE' }, take: 1 },
      },
    });

    if (!user) throw AppError.notFound('User profile not found.');

    const latestWeightKg = user.weightLogs[0]?.weightKg ?? null;
    const activeGoalType: GoalType = user.goals[0]?.type ?? 'CUSTOM';

    const metrics = this.computeMetrics({
      profile: user.profile,
      weightKg: latestWeightKg,
      goalType: activeGoalType,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      profile: user.profile,
      metrics,
    };
  }

  /**
   * Completes user onboarding in a single atomic database transaction.
   */
  static async completeOnboarding(userId: string, input: OnboardingInput): Promise<UserProfileResponse> {
    await prisma.$transaction(async (tx) => {
      if (input.name) {
        await tx.user.update({ where: { id: userId }, data: { name: input.name } });
      }

      const dobDate = new Date(input.dateOfBirth);
      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          dateOfBirth: dobDate,
          sex: input.sex,
          heightCm: input.heightCm,
          weightUnit: input.weightUnit,
          activityLevel: input.activityLevel,
          experienceLevel: input.experienceLevel,
          onboardingComplete: true,
          notificationsEnabled: input.notificationsEnabled,
        },
        update: {
          dateOfBirth: dobDate,
          sex: input.sex,
          heightCm: input.heightCm,
          weightUnit: input.weightUnit,
          activityLevel: input.activityLevel,
          experienceLevel: input.experienceLevel,
          onboardingComplete: true,
          notificationsEnabled: input.notificationsEnabled,
        },
      });

      await tx.weightLog.create({
        data: {
          userId,
          weightKg: input.currentWeightKg,
          notes: 'Initial weight recorded during onboarding',
        },
      });

      if (input.fitnessGoal) {
        const existingGoal = await tx.goal.findFirst({ where: { userId, status: 'ACTIVE' } });
        if (!existingGoal) {
          const goalTitle =
            input.fitnessGoal === 'WEIGHT_LOSS'
              ? 'Weight Loss Goal'
              : input.fitnessGoal === 'MUSCLE_GAIN'
                ? 'Muscle Hypertrophy Goal'
                : input.fitnessGoal === 'STRENGTH_TARGET'
                  ? 'Strength Target Goal'
                  : 'Consistent Workout Goal';

          await tx.goal.create({
            data: {
              userId,
              type: input.fitnessGoal,
              status: 'ACTIVE',
              title: goalTitle,
              startValue: input.currentWeightKg,
              currentValue: input.currentWeightKg,
              targetValue: input.targetWeightKg ?? undefined,
            },
          });
        }
      }
    });

    return this.getProfile(userId);
  }

  /**
   * Updates profile fields for the authenticated user.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileResponse> {
    await prisma.$transaction(async (tx) => {
      if (input.name !== undefined) {
        await tx.user.update({ where: { id: userId }, data: { name: input.name } });
      }

      const profileData: Record<string, unknown> = {};
      if (input.dateOfBirth !== undefined) profileData.dateOfBirth = new Date(input.dateOfBirth);
      if (input.sex !== undefined) profileData.sex = input.sex;
      if (input.heightCm !== undefined) profileData.heightCm = input.heightCm;
      if (input.weightUnit !== undefined) profileData.weightUnit = input.weightUnit;
      if (input.activityLevel !== undefined) profileData.activityLevel = input.activityLevel;
      if (input.experienceLevel !== undefined) profileData.experienceLevel = input.experienceLevel;
      if (input.notificationsEnabled !== undefined) profileData.notificationsEnabled = input.notificationsEnabled;

      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId },
          create: { userId, ...profileData },
          update: profileData,
        });
      }

      if (input.currentWeightKg !== undefined) {
        await tx.weightLog.create({
          data: { userId, weightKg: input.currentWeightKg },
        });
      }
    });

    return this.getProfile(userId);
  }

  /**
   * GDPR: Exports full user account and training data (RULE-SEC-005).
   */
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profile: true,
        goals: true,
        weightLogs: true,
        mealLogs: true,
        routines: {
          include: {
            days: {
              include: {
                exercises: { include: { exercise: true } },
              },
            },
          },
        },
        workoutSessions: {
          include: {
            exerciseLogs: {
              include: { sets: true },
            },
          },
        },
      },
    });

    if (!user) throw AppError.notFound('User data not found');
    return user;
  }

  /**
   * GDPR: Permanently deletes user account and all cascading data (RULE-SEC-005).
   */
  static async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Pure deterministic calculation helper for user metrics.
   */
  private static computeMetrics(params: {
    profile: UserProfile | null;
    weightKg: number | null;
    goalType: GoalType;
  }): UserMetrics {
    const { profile, weightKg, goalType } = params;

    if (!profile || !weightKg || !profile.heightCm) {
      return {
        currentWeightKg: weightKg,
        bmi: null,
        bmiCategory: null,
        age: null,
        bmr: null,
        tdee: null,
        dailyCalorieTarget: null,
        dailyProteinTargetG: null,
      };
    }

    const bmi = calculateBMI(weightKg, profile.heightCm);
    const bmiCategory = bmi !== null ? getBMICategory(bmi) : null;
    const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 25;
    const sex = profile.sex ?? 'OTHER';

    const bmr = calculateBMR({ weightKg, heightCm: profile.heightCm, ageYears: age, sex });
    const tdee = calculateTDEE({ bmr, activityLevel: profile.activityLevel });
    const dailyCalorieTarget = calculateCalorieTarget({ tdee, goalType });
    const dailyProteinTargetG = calculateProteinTarget({ weightKg, goalType });

    return {
      currentWeightKg: weightKg,
      bmi,
      bmiCategory,
      age,
      bmr,
      tdee,
      dailyCalorieTarget,
      dailyProteinTargetG,
    };
  }
}
