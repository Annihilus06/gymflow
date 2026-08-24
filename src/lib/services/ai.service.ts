import { AIClient } from '@/lib/ai/client';
import { sanitizeUserContextForAI, type RawUserProfileContext } from '@/lib/ai/guards';
import {
  WorkoutOptimizationOutputSchema,
  type WorkoutOptimizationOutput,
} from '@/lib/validations/ai.schema';
import { AppError } from '@/lib/errors/app-error';
import type { PromptExerciseInput } from '@/lib/ai/prompts';

export interface OptimizeWorkoutOptions {
  dayLabel: string;
  exercises: PromptExerciseInput[];
  userProfile?: RawUserProfileContext | null;
  timeBudgetMinutes?: number | null;
  focusGoal?: string | null;
}

export class AIService {
  /**
   * Optimizes workout exercise ordering and provides biomechanical recommendations.
   * NOTE: AIService does NOT import or write to Prisma (RULE-AI-003).
   * All results are strictly validated with Zod (RULE-AI-002) and verified against known exercise IDs.
   */
  static async optimizeWorkoutDay(options: OptimizeWorkoutOptions): Promise<WorkoutOptimizationOutput> {
    const { dayLabel, exercises, userProfile, timeBudgetMinutes, focusGoal } = options;

    if (exercises.length === 0) {
      throw AppError.badRequest('Cannot optimize a workout day with 0 exercises.');
    }

    // 1. Sanitize user profile to strip PII (RULE-AI-004)
    const sanitizedUserContext = sanitizeUserContextForAI(userProfile);

    // 2. Call AI provider with timeout and retry handling
    let rawOutput: string;
    try {
      rawOutput = await AIClient.generateWorkoutOptimization({
        dayLabel,
        exercises,
        userContext: sanitizedUserContext,
        timeBudgetMinutes,
        focusGoal,
      });
    } catch {
      throw AppError.serviceUnavailable(
        'AI_UNAVAILABLE',
        'AI optimization service is temporarily unavailable. Please try again later.'
      );
    }

    // 3. Parse JSON and validate against strict Zod Schema (RULE-AI-002)
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawOutput);
    } catch {
      throw AppError.validation(null, 'AI returned malformed JSON output.');
    }

    const parseResult = WorkoutOptimizationOutputSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      throw AppError.validation(
        parseResult.error.flatten().fieldErrors,
        'AI output failed schema validation.'
      );
    }

    const validatedData = parseResult.data;

    // 4. Business Rule Validation: Verify all returned exercise IDs match actual DB items
    const validExerciseIds = new Set(exercises.map((e) => e.id));
    const sanitizedOrderedExercises = validatedData.orderedExercises.filter((item) =>
      validExerciseIds.has(item.exerciseId)
    );

    // Ensure all original exercises are represented (prevent AI from dropping items)
    const returnedIds = new Set(sanitizedOrderedExercises.map((e) => e.exerciseId));
    let nextPosition = sanitizedOrderedExercises.length;

    for (const original of exercises) {
      if (!returnedIds.has(original.id)) {
        sanitizedOrderedExercises.push({
          exerciseId: original.id,
          suggestedPosition: nextPosition++,
          rationale: 'Retained in sequence from original routine.',
        });
      }
    }

    // Normalize positions 0..n
    sanitizedOrderedExercises.sort((a, b) => a.suggestedPosition - b.suggestedPosition);
    sanitizedOrderedExercises.forEach((item, idx) => {
      item.suggestedPosition = idx;
    });

    return {
      orderedExercises: sanitizedOrderedExercises,
      recommendations: validatedData.recommendations,
      warnings: validatedData.warnings,
      reasoningSummary: validatedData.reasoningSummary,
    };
  }
}
