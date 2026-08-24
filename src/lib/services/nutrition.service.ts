import prisma from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import { calculateBMI, getBMICategory } from '@/lib/utils/bmi';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
} from '@/lib/utils/calories';
import { calculateProteinTarget } from '@/lib/utils/protein';
import type { CalculateNutritionInput, LogMealInput } from '@/lib/validations/nutrition.schema';
import type { BMICategory } from '@/constants/bmi-categories';

export interface NutritionTargetsResult {
  bmi: number | null;
  bmiCategory: BMICategory | null;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  dailyProteinTargetG: number;
  formulas: {
    bmr: string;
    tdee: string;
    bmi: string;
    calorieTarget: string;
    proteinTarget: string;
  };
  disclaimer: {
    isMedicalDiagnosis: boolean;
    notice: string;
  };
}

export interface MealLogItem {
  id: string;
  name: string;
  estimatedCalories: number;
  estimatedProteinG: number;
  loggedAt: Date;
  notes: string | null;
}

export interface DailyNutritionProgress {
  date: string;
  targets: NutritionTargetsResult;
  consumedCalories: number;
  calorieProgressPct: number;
  remainingCalories: number;
  consumedProteinG: number;
  proteinProgressPct: number;
  remainingProteinG: number;
  meals: MealLogItem[];
}

export class NutritionService {
  private static FORMULA_DISCLAIMER = {
    isMedicalDiagnosis: false,
    notice:
      'These nutrition metrics are mathematical estimates calculated using standard sports nutrition models. They are intended solely for general fitness and nutritional guidance, not as medical diagnosis or guaranteed prescriptions.',
  };

  private static FORMULA_METADATA = {
    bmr: 'Mifflin-St Jeor Equation (1990)',
    tdee: 'Mifflin-St Jeor * Physical Activity Level (PAL) Multiplier',
    bmi: 'Quetelet Index (WHO Standard: kg/m²)',
    calorieTarget: 'TDEE + Goal Adjustment Delta (Safety Floor: 1,200 kcal)',
    proteinTarget: 'Sports Nutrition Body Weight Ratio (g/kg)',
  };

  /**
   * Deterministically calculates nutrition targets from input parameters.
   * Strictly application code without AI (RULE-AI-001).
   */
  static calculateTargets(input: CalculateNutritionInput): NutritionTargetsResult {
    const bmi = calculateBMI(input.weightKg, input.heightCm);
    const bmiCategory = bmi !== null ? getBMICategory(bmi) : null;

    const bmr = calculateBMR({
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      ageYears: input.ageYears,
      sex: input.sex,
    });

    const tdee = calculateTDEE({
      bmr,
      activityLevel: input.activityLevel,
    });

    const dailyCalorieTarget = calculateCalorieTarget({
      tdee,
      goalType: input.goalType,
    });

    const dailyProteinTargetG = calculateProteinTarget({
      weightKg: input.weightKg,
      goalType: input.goalType,
    });

    return {
      bmi,
      bmiCategory,
      bmr,
      tdee,
      dailyCalorieTarget,
      dailyProteinTargetG,
      formulas: this.FORMULA_METADATA,
      disclaimer: this.FORMULA_DISCLAIMER,
    };
  }

  /**
   * Retrieves calculated nutrition targets for a registered user using their profile & active goal.
   */
  static async getUserTargets(userId: string): Promise<NutritionTargetsResult> {
    const [profile, latestWeight, activeGoal] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.weightLog.findFirst({ where: { userId }, orderBy: { loggedAt: 'desc' } }),
      prisma.goal.findFirst({ where: { userId, status: 'ACTIVE' } }),
    ]);

    if (!profile) {
      throw AppError.notFound('User profile not found. Please complete onboarding.');
    }

    const ageYears = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 25;
    const sex = profile.sex || 'OTHER';
    const weightKg = latestWeight?.weightKg || 70;
    const heightCm = profile.heightCm || 170;
    const activityLevel = profile.activityLevel || 'MODERATELY_ACTIVE';
    const goalType = (activeGoal?.type || 'CUSTOM') as CalculateNutritionInput['goalType'];

    return this.calculateTargets({
      weightKg,
      heightCm,
      ageYears,
      sex,
      activityLevel,
      goalType,
    });
  }

  /**
   * Calculates daily nutrition progress (consumed vs target calories & protein).
   */
  static async getDailyNutritionProgress(
    userId: string,
    referenceDate = new Date()
  ): Promise<DailyNutritionProgress> {
    const targets = await this.getUserTargets(userId);

    const ref = new Date(referenceDate);
    const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);

    const meals = await prisma.mealLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { loggedAt: 'asc' },
    });

    const consumedCalories = meals.reduce((sum, m) => sum + m.estimatedCalories, 0);
    const consumedProteinG = Math.round(
      meals.reduce((sum, m) => sum + m.estimatedProteinG, 0) * 10
    ) / 10;

    const calorieProgressPct =
      targets.dailyCalorieTarget > 0
        ? Math.min(100, Math.round((consumedCalories / targets.dailyCalorieTarget) * 100))
        : 0;

    const proteinProgressPct =
      targets.dailyProteinTargetG > 0
        ? Math.min(100, Math.round((consumedProteinG / targets.dailyProteinTargetG) * 100))
        : 0;

    const remainingCalories = Math.max(0, targets.dailyCalorieTarget - consumedCalories);
    const remainingProteinG = Math.max(0, Math.round((targets.dailyProteinTargetG - consumedProteinG) * 10) / 10);

    const dateStr = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(
      ref.getDate()
    ).padStart(2, '0')}`;

    return {
      date: dateStr,
      targets,
      consumedCalories,
      calorieProgressPct,
      remainingCalories,
      consumedProteinG,
      proteinProgressPct,
      remainingProteinG,
      meals: meals.map((m) => ({
        id: m.id,
        name: m.name,
        estimatedCalories: m.estimatedCalories,
        estimatedProteinG: m.estimatedProteinG,
        loggedAt: m.loggedAt,
        notes: m.notes,
      })),
    };
  }

  /**
   * Logs a meal intake record.
   */
  static async logMeal(userId: string, input: LogMealInput): Promise<MealLogItem> {
    const meal = await prisma.mealLog.create({
      data: {
        userId,
        name: input.name,
        estimatedCalories: Math.round(input.estimatedCalories),
        estimatedProteinG: Math.round(input.estimatedProteinG * 10) / 10,
        loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
        notes: input.notes,
      },
    });

    return {
      id: meal.id,
      name: meal.name,
      estimatedCalories: meal.estimatedCalories,
      estimatedProteinG: meal.estimatedProteinG,
      loggedAt: meal.loggedAt,
      notes: meal.notes,
    };
  }

  /**
   * Deletes a meal intake record.
   */
  static async deleteMeal(userId: string, mealId: string): Promise<{ success: boolean }> {
    const meal = await prisma.mealLog.findFirst({
      where: { id: mealId, userId },
    });

    if (!meal) {
      throw AppError.notFound('Meal log not found.');
    }

    await prisma.mealLog.delete({
      where: { id: mealId },
    });

    return { success: true };
  }
}
