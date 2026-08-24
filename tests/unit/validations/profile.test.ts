import { describe, it, expect } from 'vitest';
import { onboardingSchema, updateProfileSchema } from '@/lib/validations/profile.schema';

describe('Profile Validation Schemas', () => {
  describe('onboardingSchema', () => {
    it('accepts complete valid onboarding data', () => {
      const valid = {
        name: 'Jordan',
        dateOfBirth: '1998-06-15',
        sex: 'MALE',
        heightCm: 180,
        currentWeightKg: 80,
        targetWeightKg: 75,
        weightUnit: 'KG',
        activityLevel: 'MODERATELY_ACTIVE',
        experienceLevel: 'INTERMEDIATE',
        fitnessGoal: 'WEIGHT_LOSS',
        notificationsEnabled: true,
      };
      const result = onboardingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects age under 13 years old', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() - 10);
      const invalid = {
        name: 'Kid',
        dateOfBirth: futureDate.toISOString().split('T')[0],
        sex: 'FEMALE',
        heightCm: 150,
        currentWeightKg: 45,
        activityLevel: 'LIGHTLY_ACTIVE',
        fitnessGoal: 'WORKOUT_FREQUENCY',
      };
      const result = onboardingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects height outside physiological limits (< 50 cm or > 260 cm)', () => {
      const invalidLow = {
        dateOfBirth: '1995-01-01',
        sex: 'MALE',
        heightCm: 40,
        currentWeightKg: 70,
        activityLevel: 'SEDENTARY',
        fitnessGoal: 'CUSTOM',
      };
      const invalidHigh = {
        ...invalidLow,
        heightCm: 300,
      };
      expect(onboardingSchema.safeParse(invalidLow).success).toBe(false);
      expect(onboardingSchema.safeParse(invalidHigh).success).toBe(false);
    });

    it('rejects weight outside physiological limits (< 20 kg or > 350 kg)', () => {
      const invalidLow = {
        dateOfBirth: '1995-01-01',
        sex: 'FEMALE',
        heightCm: 165,
        currentWeightKg: 15,
        activityLevel: 'SEDENTARY',
        fitnessGoal: 'CUSTOM',
      };
      const invalidHigh = {
        ...invalidLow,
        currentWeightKg: 400,
      };
      expect(onboardingSchema.safeParse(invalidLow).success).toBe(false);
      expect(onboardingSchema.safeParse(invalidHigh).success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('accepts partial updates', () => {
      const partial = {
        heightCm: 182,
        currentWeightKg: 79.5,
        activityLevel: 'VERY_ACTIVE' as const,
      };
      const result = updateProfileSchema.safeParse(partial);
      expect(result.success).toBe(true);
    });

    it('rejects invalid fields in partial updates', () => {
      const invalid = {
        heightCm: -10,
      };
      const result = updateProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
