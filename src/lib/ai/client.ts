import { buildOptimizationSystemPrompt, type PromptExerciseInput } from './prompts';
import type { SanitizedAIUserContext } from './guards';
import type { WorkoutOptimizationOutput } from '@/lib/validations/ai.schema';

const COMPOUND_KEYWORDS = [
  'press',
  'squat',
  'deadlift',
  'pull-up',
  'pullup',
  'row',
  'dip',
  'chin-up',
  'lunge',
  'thrust',
];

export class AIClient {
  /**
   * Generates workout optimization recommendations using LLM or deterministic biomechanical rules.
   */
  static async generateWorkoutOptimization(params: {
    dayLabel: string;
    exercises: PromptExerciseInput[];
    userContext: SanitizedAIUserContext;
    timeBudgetMinutes?: number | null;
    focusGoal?: string | null;
  }): Promise<string> {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const systemPrompt = buildOptimizationSystemPrompt();
        const userPrompt = JSON.stringify(params);

        // Standard OpenAI-compatible or Google AI endpoint call
        const apiEndpoint =
          process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';

        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1500,
            temperature: 0.2, // Low temperature for deterministic, consistent structure
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            return content;
          }
        }
      } catch {
        // Fall through to deterministic biomechanics engine
      }
    }

    // Deterministic biomechanics fallback engine
    return this.generateDeterministicOptimization(params);
  }

  /**
   * Deterministic Biomechanical Optimization Engine.
   * Runs pure algorithmic analysis prioritizing compounds, volume thresholds, and balance.
   */
  private static generateDeterministicOptimization(params: {
    dayLabel: string;
    exercises: PromptExerciseInput[];
    userContext: SanitizedAIUserContext;
    timeBudgetMinutes?: number | null;
    focusGoal?: string | null;
  }): string {
    const { dayLabel, exercises } = params;

    // 1. Sort exercises: Heavy multi-joint compounds first, isolations later
    const scoredExercises = exercises.map((ex) => {
      const nameLower = ex.name.toLowerCase();
      const isCompound = COMPOUND_KEYWORDS.some((kw) => nameLower.includes(kw));
      return {
        ...ex,
        score: isCompound ? 10 : 1,
      };
    });

    // Sort descending by compound priority
    scoredExercises.sort((a, b) => b.score - a.score);

    const orderedExercises = scoredExercises.map((ex, index) => ({
      exerciseId: ex.id,
      suggestedPosition: index,
      rationale:
        ex.score > 5
          ? 'Primary compound multi-joint movement prioritized for maximum neural drive and strength output.'
          : 'Isolation exercise positioned after compound lifts to safely fatigue targeted muscle fibers.',
    }));

    // 2. Volume analysis
    const totalSets = exercises.reduce((acc, ex) => acc + ex.defaultSets, 0);
    const warnings: Array<{
      type: 'EXCESSIVE_VOLUME' | 'MUSCLE_IMBALANCE' | 'REDUNDANCY' | 'RECOVERY_RISK';
      message: string;
      affectedMuscles: string[];
    }> = [];

    if (totalSets > 18) {
      warnings.push({
        type: 'EXCESSIVE_VOLUME',
        message: `High total volume detected (${totalSets} total sets). Consider reducing to 12-16 sets per workout to avoid junk volume and optimize recovery.`,
        affectedMuscles: Array.from(new Set(exercises.flatMap((e) => e.muscles))),
      });
    }

    // 3. Balance observations
    const muscles = exercises.flatMap((e) => e.muscles.map((m) => m.toLowerCase()));
    if (muscles.includes('chest') && !muscles.includes('shoulders')) {
      warnings.push({
        type: 'MUSCLE_IMBALANCE',
        message: 'Push workout lacks direct overhead or lateral deltoid stimulus.',
        affectedMuscles: ['Shoulders'],
      });
    }

    // 4. Recommendations
    const recommendations: Array<{
      type: 'ORDERING' | 'EFFICIENCY' | 'PROGRESSION' | 'SUBSTITUTION' | 'GENERAL';
      title: string;
      message: string;
    }> = [
      {
        type: 'ORDERING',
        title: 'Compound-First Sequencing',
        message:
          'Place the heaviest multi-joint compound movements at the beginning of the workout when stabilizer muscles are not fatigued.',
      },
      {
        type: 'PROGRESSION',
        title: 'Progressive Overload Strategy',
        message:
          'Aim to add 1 rep or +1.25-2.5 kg on your primary compound lift before increasing accessory volume.',
      },
    ];

    if (params.timeBudgetMinutes && params.timeBudgetMinutes < 45 && exercises.length > 4) {
      recommendations.push({
        type: 'EFFICIENCY' as const,
        title: 'Time-Restricted Optimization',
        message:
          'Given your tight time budget, focus on the top 3-4 compound movements and consider supersetting agonist/antagonist exercises.',
      });
    }

    const output: WorkoutOptimizationOutput = {
      orderedExercises,
      recommendations,
      warnings,
      reasoningSummary: `Analysis for "${dayLabel}": Reordered ${exercises.length} exercises prioritizing central nervous system readiness for heavy compound movements followed by targeted hypertrophy accessories.`,
    };

    return JSON.stringify(output);
  }

  /**
   * Generates tailored split and exercise recommendations based on user fitness goal.
   */
  static async generateGoalSuggestions(params: {
    dayLabel: string;
    dayOfWeek?: string | null;
    userGoal: string;
    experienceLevel: string;
    currentExercises?: Array<{ name: string; primaryMuscle?: string | null }>;
  }): Promise<string> {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const { buildGoalSuggestionSystemPrompt, buildGoalSuggestionUserPrompt } = await import(
          './prompts'
        );

        const systemPrompt = buildGoalSuggestionSystemPrompt();
        const userPrompt = buildGoalSuggestionUserPrompt(params);
        const apiEndpoint =
          process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';

        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1500,
            temperature: 0.2,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            return content;
          }
        }
      } catch {
        // Fall back to deterministic engine
      }
    }

    return this.generateDeterministicGoalSuggestions(params);
  }

  /**
   * Deterministic Goal-Based Programming Engine.
   */
  private static generateDeterministicGoalSuggestions(params: {
    dayLabel: string;
    dayOfWeek?: string | null;
    userGoal: string;
    experienceLevel: string;
    currentExercises?: Array<{ name: string; primaryMuscle?: string | null }>;
  }): string {
    const { dayLabel, dayOfWeek, userGoal, experienceLevel } = params;
    const labelLower = dayLabel.toLowerCase();
    const isStrength = userGoal.toUpperCase().includes('STRENGTH');
    const isWeightLoss = userGoal.toUpperCase().includes('WEIGHT_LOSS') || userGoal.toUpperCase().includes('FAT');
    
    const repRange = isStrength ? '4–6 reps' : isWeightLoss ? '12–15 reps' : '8–12 reps';
    const repRangeDescription = isStrength
      ? '4–6 reps (Heavy strength & neural drive)'
      : isWeightLoss
      ? '12–15 reps (Metabolic conditioning & hypertrophy)'
      : '8–12 reps (Hypertrophy & muscle hypertrophy sweet-spot)';

    const recommendations: Array<{
      name: string;
      category: string;
      primaryMuscle: string;
      targetSets: number;
      targetReps: string;
      rationale: string;
    }> = [];

    // Analyze day focus muscles
    if (labelLower.includes('chest') || labelLower.includes('push') || labelLower.includes('upper')) {
      recommendations.push({
        name: isStrength ? 'Barbell Bench Press' : 'Incline Dumbbell Press',
        category: 'STRENGTH',
        primaryMuscle: 'Chest',
        targetSets: isStrength ? 4 : 3,
        targetReps: repRange,
        rationale: 'Primary compound horizontal pressing movement for upper pectoral recruitment.',
      });
      recommendations.push({
        name: 'Cable Fly',
        category: 'STRENGTH',
        primaryMuscle: 'Chest',
        targetSets: 3,
        targetReps: isStrength ? '8-10 reps' : '12-15 reps',
        rationale: 'Continuous resistance isolation along the chest adduction arc.',
      });
    }

    if (labelLower.includes('back') || labelLower.includes('pull') || labelLower.includes('upper')) {
      recommendations.push({
        name: 'Barbell Bent-Over Row',
        category: 'STRENGTH',
        primaryMuscle: 'Back',
        targetSets: isStrength ? 4 : 3,
        targetReps: repRange,
        rationale: 'Compound horizontal pull building upper back thickness and rhomboid stability.',
      });
      recommendations.push({
        name: 'Lat Pulldown',
        category: 'STRENGTH',
        primaryMuscle: 'Back',
        targetSets: 3,
        targetReps: repRange,
        rationale: 'Vertical pulling movement developing latissimus dorsi width.',
      });
    }

    if (labelLower.includes('tricep') || labelLower.includes('arms') || labelLower.includes('push')) {
      recommendations.push({
        name: 'Tricep Rope Pushdown',
        category: 'STRENGTH',
        primaryMuscle: 'Triceps',
        targetSets: 3,
        targetReps: isStrength ? '8-10 reps' : '10-12 reps',
        rationale: 'Targeted lockout isolation for lateral and medial triceps heads.',
      });
    }

    if (labelLower.includes('bicep') || labelLower.includes('arms') || labelLower.includes('pull') || labelLower.includes('curl')) {
      recommendations.push({
        name: 'Dumbbell Incline Bicep Curl',
        category: 'STRENGTH',
        primaryMuscle: 'Biceps',
        targetSets: 3,
        targetReps: '10-12 reps',
        rationale: 'Deep long-head bicep stretch under load for maximal peak development.',
      });
    }

    if (labelLower.includes('shoulder') || labelLower.includes('delts') || labelLower.includes('push')) {
      recommendations.push({
        name: 'Dumbbell Lateral Raise',
        category: 'STRENGTH',
        primaryMuscle: 'Shoulders',
        targetSets: 3,
        targetReps: '12-15 reps',
        rationale: 'Isolates medial deltoids to create shoulder width and V-taper symmetry.',
      });
    }

    if (labelLower.includes('leg') || labelLower.includes('quad') || labelLower.includes('squat')) {
      recommendations.push({
        name: 'Barbell Back Squat',
        category: 'STRENGTH',
        primaryMuscle: 'Quads',
        targetSets: isStrength ? 4 : 3,
        targetReps: repRange,
        rationale: 'Gold standard lower body compound movement for quad and glute development.',
      });
      recommendations.push({
        name: 'Romanian Deadlift',
        category: 'STRENGTH',
        primaryMuscle: 'Hamstrings',
        targetSets: 3,
        targetReps: repRange,
        rationale: 'Posterior chain hinge targeting hamstring stretch under load.',
      });
    }

    // Default fallback if no specific keyword detected
    if (recommendations.length === 0) {
      recommendations.push(
        {
          name: 'Barbell Bench Press',
          category: 'STRENGTH',
          primaryMuscle: 'Chest',
          targetSets: 3,
          targetReps: repRange,
          rationale: 'Essential upper body pressing compound.',
        },
        {
          name: 'Lat Pulldown',
          category: 'STRENGTH',
          primaryMuscle: 'Back',
          targetSets: 3,
          targetReps: repRange,
          rationale: 'Vertical pulling movement for back development.',
        },
        {
          name: 'Barbell Bicep Curl',
          category: 'STRENGTH',
          primaryMuscle: 'Biceps',
          targetSets: 3,
          targetReps: repRange,
          rationale: 'Direct bicep hypertrophy builder.',
        }
      );
    }

    const output = {
      goalAnalysis: `For your ${userGoal.replace('_', ' ')} goal as a ${experienceLevel.toLowerCase()} athlete, this ${dayLabel} session is structured to maximize mechanical tension while managing neural fatigue.`,
      splitAssessment: `Combining ${dayLabel} on ${dayOfWeek || 'this day'} creates high systemic efficiency. We prioritized heavy compound multi-joint movements followed by targeted isolation finishers.`,
      recommendedExercises: recommendations,
      formAndRecoveryTips: [
        'Perform 2 warm-up sets with progressive weight before working sets.',
        'Control the lowering (eccentric) phase for 2–3 seconds on each repetition.',
        'Maintain a 60–90 second rest window between hypertrophy sets to ensure muscular recovery.',
      ],
      suggestedRepRangeForGoal: repRangeDescription,
    };

    return JSON.stringify(output);
  }
}

