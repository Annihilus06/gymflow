import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine((dob) => {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return false;
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 120;
    }, 'You must be between 13 and 120 years old to use GymFlow'),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Please select your biological sex for metabolic calculations',
  }),
  heightCm: z
    .number({ invalid_type_error: 'Height must be a number' })
    .min(50, 'Height must be at least 50 cm')
    .max(260, 'Height must be at most 260 cm'),
  currentWeightKg: z
    .number({ invalid_type_error: 'Weight must be a number' })
    .min(20, 'Weight must be at least 20 kg')
    .max(350, 'Weight must be at most 350 kg'),
  targetWeightKg: z
    .number({ invalid_type_error: 'Target weight must be a number' })
    .min(20, 'Target weight must be at least 20 kg')
    .max(350, 'Target weight must be at most 350 kg')
    .optional()
    .nullable(),
  weightUnit: z.enum(['KG', 'LB']),
  activityLevel: z.enum(
    ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'],
    { required_error: 'Please select your activity level' }
  ),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  fitnessGoal: z.enum(
    ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH_TARGET', 'WORKOUT_FREQUENCY', 'CUSTOM'],
    { required_error: 'Please select your primary fitness goal' }
  ),
  notificationsEnabled: z.boolean(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  heightCm: z.number().min(50).max(260).optional(),
  currentWeightKg: z.number().min(20).max(350).optional(),
  weightUnit: z.enum(['KG', 'LB']).optional(),
  activityLevel: z
    .enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'])
    .optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
