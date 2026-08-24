import { describe, it, expect } from 'vitest';
import { calculateBMI, getBMICategory } from '@/lib/utils/bmi';
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateAge } from '@/lib/utils/calories';
import { calculateProteinTarget } from '@/lib/utils/protein';
import { NutritionService } from '@/lib/services/nutrition.service';

describe('Deterministic Nutrition Calculations (RULE-AI-001)', () => {
  describe('Known Input / Output Case 1: Male Weight Loss (Sedentary)', () => {
    const input = {
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'MALE' as const,
      activityLevel: 'SEDENTARY' as const, // 1.2
      goalType: 'WEIGHT_LOSS' as const, // -500 kcal, 2.2 g/kg
    };

    it('calculates BMI: 80 / (1.8^2) = 24.69 (Normal weight)', () => {
      const bmi = calculateBMI(input.weightKg, input.heightCm);
      expect(bmi).toBe(24.69);
      expect(getBMICategory(bmi!)).toBe('Normal weight');
    });

    it('calculates BMR (Mifflin-St Jeor): 10*80 + 6.25*180 - 5*30 + 5 = 1780 kcal', () => {
      const bmr = calculateBMR(input);
      expect(bmr).toBe(1780);
    });

    it('calculates TDEE: 1780 * 1.2 = 2136 kcal', () => {
      const bmr = calculateBMR(input);
      const tdee = calculateTDEE({ bmr, activityLevel: input.activityLevel });
      expect(tdee).toBe(2136);
    });

    it('calculates Calorie Target: 2136 - 500 = 1636 kcal', () => {
      const bmr = calculateBMR(input);
      const tdee = calculateTDEE({ bmr, activityLevel: input.activityLevel });
      const target = calculateCalorieTarget({ tdee, goalType: input.goalType });
      expect(target).toBe(1636);
    });

    it('calculates Protein Target: 80 * 2.2 = 176 g', () => {
      const protein = calculateProteinTarget({ weightKg: input.weightKg, goalType: input.goalType });
      expect(protein).toBe(176);
    });
  });

  describe('Known Input / Output Case 2: Female Muscle Gain (Very Active)', () => {
    const input = {
      weightKg: 60,
      heightCm: 165,
      ageYears: 25,
      sex: 'FEMALE' as const,
      activityLevel: 'VERY_ACTIVE' as const, // 1.725
      goalType: 'MUSCLE_GAIN' as const, // +250 kcal, 2.0 g/kg
    };

    it('calculates BMR: 10*60 + 6.25*165 - 5*25 - 161 = 1345 kcal', () => {
      const bmr = calculateBMR(input);
      expect(bmr).toBe(1345);
    });

    it('calculates TDEE: 1345 * 1.725 = 2320 kcal', () => {
      const bmr = calculateBMR(input);
      const tdee = calculateTDEE({ bmr, activityLevel: input.activityLevel });
      expect(tdee).toBe(2320);
    });

    it('calculates Calorie Target: 2320 + 250 = 2570 kcal', () => {
      const bmr = calculateBMR(input);
      const tdee = calculateTDEE({ bmr, activityLevel: input.activityLevel });
      const target = calculateCalorieTarget({ tdee, goalType: input.goalType });
      expect(target).toBe(2570);
    });

    it('calculates Protein Target: 60 * 2.0 = 120 g', () => {
      const protein = calculateProteinTarget({ weightKg: input.weightKg, goalType: input.goalType });
      expect(protein).toBe(120);
    });
  });

  describe('Edge Cases & Missing/Invalid Inputs', () => {
    it('returns null or 0 for invalid height or weight', () => {
      expect(calculateBMI(0, 180)).toBeNull();
      expect(calculateBMI(80, 0)).toBeNull();
      expect(calculateBMI(-80, 180)).toBeNull();
      expect(calculateBMR({ weightKg: 0, heightCm: 180, ageYears: 25, sex: 'MALE' })).toBe(0);
      expect(calculateBMR({ weightKg: 80, heightCm: 0, ageYears: 25, sex: 'MALE' })).toBe(0);
      expect(calculateProteinTarget({ weightKg: 0, goalType: 'WEIGHT_LOSS' })).toBe(0);
    });

    it('enforces safe calorie floor of 1200 kcal for aggressive deficits', () => {
      const lowTdee = 1300;
      const target = calculateCalorieTarget({ tdee: lowTdee, goalType: 'WEIGHT_LOSS' }); // 1300 - 500 = 800 -> clamped to 1200
      expect(target).toBe(1200);
    });

    it('calculates exact age from date of birth', () => {
      const ref = new Date(2026, 7, 24); // Aug 24, 2026
      expect(calculateAge('1996-08-24', ref)).toBe(30);
      expect(calculateAge('1996-08-25', ref)).toBe(29); // Birthday is tomorrow
      expect(calculateAge('1996-08-23', ref)).toBe(30); // Birthday was yesterday
    });

    it('includes medical disclaimer and formula metadata via NutritionService', () => {
      const result = NutritionService.calculateTargets({
        weightKg: 75,
        heightCm: 175,
        ageYears: 28,
        sex: 'MALE',
        activityLevel: 'MODERATELY_ACTIVE',
        goalType: 'STRENGTH_TARGET',
      });

      expect(result.disclaimer.isMedicalDiagnosis).toBe(false);
      expect(result.disclaimer.notice).toContain('intended solely for general fitness');
      expect(result.formulas.bmr).toContain('Mifflin-St Jeor');
      expect(result.dailyCalorieTarget).toBeGreaterThan(1200);
      expect(result.dailyProteinTargetG).toBe(135); // 75 * 1.8 = 135g
    });
  });
});
