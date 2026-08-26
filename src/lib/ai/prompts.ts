import { sanitizeTextForPrompt, type SanitizedAIUserContext } from './guards';

export interface PromptExerciseInput {
  id: string; // The routineDayExercise ID
  exerciseId: string; // The exercise definition ID
  name: string;
  category: string;
  muscles: string[];
  defaultSets: number;
  defaultReps: number;
  notes?: string | null;
}

export function buildOptimizationSystemPrompt(): string {
  return `You are GymFlow's Senior Exercise Biomechanics & Programming Advisor.

Your task is to analyze a planned workout day and provide structured optimization recommendations.

Core Biomechanical Principles:
1. ORDERING: Place heavy multi-joint compound movements (e.g. Squat, Deadlift, Bench Press, Overhead Press, Barbell Row) first when the central nervous system and stabilizer muscles are fresh. Place isolation and machine exercises later.
2. VOLUME & FATIGUE: Flag excessive volume if total sets for a single session exceed 20 sets or if an individual muscle group exceeds 10-12 sets in a single workout.
3. REDUNDANCY & EFFICIENCY: Flag duplicate movement patterns that provide redundant stimulus without additional hypertrophy benefit.
4. MUSCLE BALANCE: Identify missing antagonist or synergist muscles (e.g. missing rear delts on a push/chest day).
5. TIME EFFICIENCY: If a time budget is specified, prioritize highest ROI movements.

CRITICAL RULES:
- Output MUST be valid, well-formed JSON matching the required schema.
- You MUST ONLY reference the exact exercise item IDs provided in the user's exercise list.
- DO NOT invent, hallucinate, or synthesize exercise IDs.
- Keep explanations concise, professional, and science-backed.`;
}

export function buildOptimizationUserPrompt(params: {
  dayLabel: string;
  exercises: PromptExerciseInput[];
  userContext: SanitizedAIUserContext;
  timeBudgetMinutes?: number | null;
  focusGoal?: string | null;
}): string {
  const { dayLabel, exercises, userContext, timeBudgetMinutes, focusGoal } = params;

  const exerciseListJson = exercises.map((e, index) => ({
    exerciseItemId: e.id,
    exerciseId: e.exerciseId,
    name: sanitizeTextForPrompt(e.name, 60),
    currentOrder: index + 1,
    category: e.category,
    primaryMuscles: e.muscles,
    sets: e.defaultSets,
    reps: e.defaultReps,
    notes: sanitizeTextForPrompt(e.notes, 100),
  }));

  return `Please analyze and optimize this workout session:

Day Focus: "${sanitizeTextForPrompt(dayLabel, 50)}"
User Profile: Experience Level = ${userContext.experienceLevel}, Activity Level = ${userContext.activityLevel}, Goal = ${userContext.fitnessGoal}
${timeBudgetMinutes ? `Time Budget: ${timeBudgetMinutes} minutes` : ''}
${focusGoal ? `Special Focus: "${sanitizeTextForPrompt(focusGoal, 80)}"` : ''}

Current Planned Exercises (Total: ${exercises.length}):
${JSON.stringify(exerciseListJson, null, 2)}

Respond with a JSON object strictly conforming to this schema:
{
  "orderedExercises": [
    {
      "exerciseId": "exact exerciseItemId from above list",
      "suggestedPosition": 0,
      "rationale": "Reason for position (e.g. Primary compound movement)"
    }
  ],
  "recommendations": [
    {
      "type": "ORDERING" | "EFFICIENCY" | "PROGRESSION" | "SUBSTITUTION" | "GENERAL",
      "title": "Short title",
      "message": "Actionable advice"
    }
  ],
  "warnings": [
    {
      "type": "EXCESSIVE_VOLUME" | "MUSCLE_IMBALANCE" | "REDUNDANCY" | "RECOVERY_RISK",
      "message": "Warning description",
      "affectedMuscles": ["Chest", "Triceps"]
    }
  ],
  "reasoningSummary": "Short paragraph summarizing the biomechanical rationale."
}`;
}

export function buildGoalSuggestionSystemPrompt(): string {
  return `You are GymFlow's Chief Exercise Physiologist and Workout Programming AI.

Your task is to analyze the user's custom workout day split (e.g., "Chest + Back + Triceps" on Sunday) and their primary goal (e.g., Muscle Gain / Hypertrophy, Strength Target, Fat Loss) and recommend the best exercises, rep schemes, volume, and biomechanical form cues.

Programming Principles:
1. MUSCLE GAIN / HYPERTROPHY: Target 8–12 reps per set with 3–4 working sets. Focus on high mechanical tension, stretch under load, and paired antagonist or compound-accessory supersets.
2. STRENGTH: Target 4–6 reps on heavy compound movements (Bench Press, Barbell Row, Overhead Press, Squats, Deadlifts) with longer rest periods.
3. FAT LOSS / WORKOUT FREQUENCY: Target 10–15 reps with controlled tempo and balanced push/pull volume.
4. SPLIT BALANCE: If user selects multiple muscle groups on one day (e.g., Chest, Back & Triceps), ensure optimal sequencing (primary compound chest press -> compound row -> tricep extension -> accessory).

CRITICAL RULES:
- Output MUST be valid, well-formed JSON matching the required schema.
- Do not output any Markdown wrapping outside the JSON object.
- Keep recommendations practical, safe, and motivating.`;
}

export function buildGoalSuggestionUserPrompt(params: {
  dayLabel: string;
  dayOfWeek?: string | null;
  userGoal: string;
  experienceLevel: string;
  currentExercises?: Array<{ name: string; primaryMuscle?: string | null }>;
}): string {
  const { dayLabel, dayOfWeek, userGoal, experienceLevel, currentExercises = [] } = params;

  return `Please provide tailored exercise and programming recommendations for this training day:

Day: ${dayOfWeek || 'Custom Day'}
Day Muscle Focus: "${sanitizeTextForPrompt(dayLabel, 60)}"
User Fitness Goal: ${userGoal}
Experience Level: ${experienceLevel}
Current Exercises Entered by User (${currentExercises.length}):
${JSON.stringify(currentExercises, null, 2)}

Respond with a JSON object strictly conforming to this schema:
{
  "goalAnalysis": "Detailed analysis of how this split supports the user's specific fitness goal.",
  "splitAssessment": "Assessment of the muscle group combinations and volume distribution.",
  "recommendedExercises": [
    {
      "name": "Exercise Name",
      "category": "STRENGTH",
      "primaryMuscle": "Target Muscle",
      "targetSets": 3,
      "targetReps": "8-12 reps",
      "rationale": "Biomechanical rationale for this movement"
    }
  ],
  "formAndRecoveryTips": [
    "Tip 1: Form / tempo / mind-muscle connection",
    "Tip 2: Recovery / protein hydration"
  ],
  "suggestedRepRangeForGoal": "e.g. 8-12 reps (Hypertrophy focus)"
}`;
}

