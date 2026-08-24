export interface RawUserProfileContext {
  dateOfBirth?: Date | string | null;
  activityLevel?: string | null;
  experienceLevel?: string | null;
  fitnessGoal?: string | null;
}

export interface SanitizedAIUserContext {
  ageRange: string;
  activityLevel: string;
  experienceLevel: string;
  fitnessGoal: string;
}

/**
 * Calculates a broad age group string (e.g. "20-29", "30-39") to prevent exposing exact DOB to AI.
 */
export function calculateAgeRange(dob?: Date | string | null): string {
  if (!dob) return 'Adult (25-35)';
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  if (isNaN(birthDate.getTime())) return 'Adult (25-35)';

  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 20) return 'Under 20';
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  return '60+';
}

/**
 * Strips all PII (name, email, exact DOB, password hash, user ID) before sending context to AI (RULE-AI-004).
 */
export function sanitizeUserContextForAI(
  rawProfile?: RawUserProfileContext | null
): SanitizedAIUserContext {
  return {
    ageRange: calculateAgeRange(rawProfile?.dateOfBirth),
    activityLevel: rawProfile?.activityLevel || 'MODERATELY_ACTIVE',
    experienceLevel: rawProfile?.experienceLevel || 'INTERMEDIATE',
    fitnessGoal: rawProfile?.fitnessGoal || 'MUSCLE_GAIN',
  };
}

/**
 * Cleans and escapes untrusted user text (notes, custom descriptions) to prevent prompt injection.
 */
export function sanitizeTextForPrompt(input?: string | null, maxLength = 200): string {
  if (!input) return '';

  return input
    .replace(/<\|im_start\|>|<\|im_end\|>/gi, '') // Special tokens
    .replace(/^(system|assistant|user|human|ai):/gim, '') // Role injection attempts
    .replace(/```/g, "'''") // Prevent markdown fence breakout
    .trim()
    .slice(0, maxLength);
}
