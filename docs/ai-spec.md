# GymFlow — AI Architecture Specification

**Version:** 1.0.0  
**Date:** 2026-08-24

---

## Table of Contents

1. [AI Philosophy](#1-ai-philosophy)
2. [AI Responsibilities](#2-ai-responsibilities)
3. [AI Boundaries — What AI Must Never Do](#3-ai-boundaries--what-ai-must-never-do)
4. [AI Integration Architecture](#4-ai-integration-architecture)
5. [Prompt Design](#5-prompt-design)
6. [Output Validation](#6-output-validation)
7. [AI Features In Detail](#7-ai-features-in-detail)
8. [Exercise API Integration Architecture](#8-exercise-api-integration-architecture)
9. [AI Security](#9-ai-security)
10. [AI Cost Controls](#10-ai-cost-controls)
11. [Failure Modes and Fallbacks](#11-failure-modes-and-fallbacks)

---

## 1. AI Philosophy

**GymFlow treats AI as a smart advisor, never as a source of truth.**

The fundamental contract is:

| Role | Responsibility |
|------|---------------|
| **Code** | All numerical calculations (BMI, BMR, TDEE, calories, protein, statistics, progress) |
| **Database** | Single source of truth for all user data |
| **AI** | Qualitative analysis, suggestions, optimization, and personalized commentary |
| **User** | Final decision-maker; all AI suggestions require explicit approval |

AI must never be a single point of failure. Every AI-powered feature must have a functional non-AI fallback.

---

## 2. AI Responsibilities

| Feature | AI Role | Output Type |
|---------|---------|-------------|
| Routine optimization | Suggest better exercise ordering for a workout day | Structured JSON |
| Imbalance detection | Flag missing muscle groups in the weekly split | Structured JSON |
| Exercise substitution | Suggest alternatives when equipment is unavailable | Structured JSON |
| Progress insights | Generate natural-language summary of training trends | Text (markdown) |
| Natural-language assistant | Answer fitness questions in a chat-like interface | Text (markdown) |
| Workout recommendations | Suggest exercises for a new routine day | Structured JSON |

---

## 3. AI Boundaries — What AI Must Never Do

This section is **normative**. Agents implementing AI features MUST enforce these rules.

### Prohibited AI Actions

| Prohibited Action | Why | Implementation Control |
|------------------|----|----------------------|
| Calculate BMI | Deterministic formula | `bmi.ts` utility only |
| Calculate BMR | Mifflin-St Jeor formula | `calories.ts` utility only |
| Calculate TDEE | BMR x activity factor | `calories.ts` utility only |
| Calculate calorie targets | Goal-adjusted TDEE | `calories.ts` utility only |
| Calculate protein targets | Weight-based formula | `protein.ts` utility only |
| Determine authorization | Session-based only | `auth()` + userId injection |
| Write to the database | AI is advisory only | No Prisma access in ai.service.ts |
| Return unvalidated output | Always parse with Zod | `validateAIOutput()` wrapper |
| Receive raw PII | Privacy protection | Strip PII before prompt construction |
| Override user-logged data | User is the source of truth | AI can only suggest, never overwrite |

### Enforcement in Code

```typescript
// src/lib/ai/guards.ts

/**
 * Strip PII and sensitive data before sending any context to AI.
 * MUST be called before every AI prompt construction.
 */
export function sanitizeUserContextForAI(profile: UserProfile): AIUserContext {
  return {
    // OK to send: aggregate metrics, preferences
    ageRange: getAgeRange(profile.dateOfBirth),     // "25-30" not exact DOB
    activityLevel: profile.activityLevel,
    experienceLevel: profile.experienceLevel,
    // NEVER send: userId, email, name, exact DOB, passwordHash
  };
}
```

---

## 4. AI Integration Architecture

```
Route Handler (/api/ai/*)
  |
  +-- 1. Authenticate: session = await auth()
  +-- 2. Extract userId (server-side only)
  +-- 3. Fetch context data from DB via service layer
  +-- 4. Sanitize: strip PII via guards.ts
  +-- 5. Build prompt via prompts.ts
  +-- 6. Call AI via ai.service.ts (Vercel AI SDK)
  +-- 7. Validate output via Zod (ai.schema.ts)
  +-- 8. Return validated suggestion to client
  |
  +-- Client receives suggestion -> User reviews -> User approves
                                                       |
                                          PATCH /api/routines/:id/days/:dayId
                                          (applies user-approved changes)
```

### AI Client Setup

```typescript
// src/lib/ai/client.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Provider abstraction — swap without changing ai.service.ts
export const aiProvider = process.env.AI_PROVIDER === 'google'
  ? createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_KEY! })
  : createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const AI_MODEL = process.env.AI_PROVIDER === 'google'
  ? 'gemini-2.0-flash'
  : 'gpt-4o';
```

---

## 5. Prompt Design

### Prompt Construction Rules

1. **System prompt is hardened** — defines role, output format, and explicit prohibitions.
2. **User input is sanitized** before inclusion (no raw free-text exercise names from user).
3. **Context is minimal** — send only data needed for the specific AI task.
4. **Output format is specified in the system prompt** as JSON schema.
5. **No PII** is ever included in any prompt.

### System Prompt Template (Routine Optimization)

```
You are a professional fitness coach assistant for GymFlow.

Your task is to analyze a user's workout routine and suggest improvements.

RULES:
- You MUST return only valid JSON matching the schema provided.
- You MUST NOT calculate BMI, BMR, TDEE, calorie targets, or any numerical health metrics.
- You MUST NOT make decisions about user authorization or data access.
- You MUST NOT suggest removing all exercises from a day.
- All suggestions are advisory; the user will approve changes.
- Base suggestions on exercise science principles:
  * Compound movements before isolation
  * Antagonist muscle balance
  * Adequate recovery between muscle groups

OUTPUT SCHEMA:
{
  "suggestions": [
    {
      "dayId": "string",
      "suggestedOrder": ["exerciseId", ...],
      "rationale": "string (max 200 chars)"
    }
  ],
  "imbalances": [
    {
      "type": "NO_POSTERIOR_CHAIN" | "INSUFFICIENT_RECOVERY" | "PUSH_PULL_IMBALANCE",
      "message": "string"
    }
  ],
  "substitutions": [
    {
      "originalExerciseId": "string",
      "suggestedExerciseId": "string",
      "rationale": "string"
    }
  ]
}
```

---

## 6. Output Validation

### Zod Schemas for AI Output

```typescript
// src/lib/validations/ai.schema.ts
import { z } from 'zod';

export const RoutineOptimizationOutputSchema = z.object({
  suggestions: z.array(z.object({
    dayId: z.string().cuid(),
    suggestedOrder: z.array(z.string().cuid()).min(1).max(30),
    rationale: z.string().max(200),
  })),
  imbalances: z.array(z.object({
    type: z.enum(['NO_POSTERIOR_CHAIN', 'INSUFFICIENT_RECOVERY', 'PUSH_PULL_IMBALANCE', 'OTHER']),
    message: z.string().max(300),
  })),
  substitutions: z.array(z.object({
    originalExerciseId: z.string().cuid(),
    suggestedExerciseId: z.string().cuid(),
    rationale: z.string().max(200),
  })),
});

export const ProgressInsightOutputSchema = z.object({
  summary: z.string().max(500),
  highlights: z.array(z.string().max(200)).max(5),
  suggestions: z.array(z.string().max(200)).max(3),
});

export const ExerciseSubstitutionOutputSchema = z.array(z.object({
  exerciseId: z.string().cuid(),
  name: z.string().max(100),
  rationale: z.string().max(200),
})).max(3);
```

### Validation Pattern

```typescript
// src/lib/services/ai.service.ts
async function validateAIOutput<T>(schema: z.ZodSchema<T>, raw: unknown): Promise<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    logger.error('AI output validation failed', { errors: result.error.flatten() });
    throw new AIOutputValidationError('AI returned an unexpected format. Please try again.');
  }
  return result.data;
}
```

---

## 7. AI Features In Detail

### 7.1 Routine Optimization

**Trigger:** User clicks "AI Optimize" on their routine page.

**Context sent to AI:**
- List of exercises per day (id, name, category, primary muscle groups)
- Days of week for each workout
- User experience level and activity level
- No PII

**Validation steps:**
1. Parse with `RoutineOptimizationOutputSchema`.
2. Verify all `dayId` values exist and belong to the user's routine.
3. Verify all `exerciseId` values exist in the exercise library.
4. Reject suggestion if it would result in 0 exercises on a non-rest day.

**User interaction:**
- Show diff view: "Current order" vs "Suggested order".
- User can accept all, accept individual day suggestions, or reject.
- On accept: call `PUT /api/routines/:id/days/:dayId/exercises/reorder`.

---

### 7.2 Progress Insights

**Trigger:** User visits the Progress page and clicks "Get AI Insights".

**Context sent to AI:**
- Aggregated stats (total volume, workout count, frequency %) for the last 4 weeks.
- Muscle group breakdown.
- Personal records (exercise name + weight, no dates).
- **Critically:** All values are pre-calculated by the stats service. AI receives numbers, not raw log data.

**Validation:** `ProgressInsightOutputSchema`.

**Display:** Markdown-rendered card with highlights and suggestions.

---

### 7.3 Exercise Substitution

**Trigger:** User taps "Can't do this" during workout execution.

**Context sent to AI:**
- Exercise name, category, primary and secondary muscle groups.
- User's available equipment (from profile).
- User experience level.

**Validation:** `ExerciseSubstitutionOutputSchema` + DB existence check for suggested exercise IDs.

**User interaction:**
- Present up to 3 alternatives with rationale.
- User selects one; exercise is swapped in-session only (not saved to routine without explicit action).

---

## 8. Exercise API Integration Architecture

### Supported External APIs

| API | Base URL | Auth | Data Quality |
|-----|---------|------|-------------|
| ExerciseDB (RapidAPI) | `https://exercisedb.p.rapidapi.com` | API Key header | High; 1300+ exercises |
| WGER REST API | `https://wger.de/api/v2` | Token or anonymous | Medium; open source |

**Decision:** Use ExerciseDB as primary, WGER as fallback. Both are normalized into the same internal schema.

### Normalization

```typescript
// src/lib/exercise-api/normalizer.ts

interface NormalizedExercise {
  externalId: string;
  name: string;
  description: string | null;
  instructions: string[];
  category: ExerciseCategory;
  imageUrl: string | null;
  videoUrl: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export function normalizeExerciseDB(raw: ExerciseDBExercise): NormalizedExercise { /* ... */ }
export function normalizeWGER(raw: WGERExercise): NormalizedExercise { /* ... */ }
```

### Sync Strategy

```
Admin triggers sync (or cron job)
  |
  v
exercise.service.ts::syncFromExternalAPI()
  |
  +-- Fetch all exercises from ExerciseDB (paginated)
  +-- Normalize each exercise
  +-- Upsert into local `exercises` table (by externalId)
  +-- Upsert muscle groups into `muscle_groups` table
  +-- Upsert exercise-muscle mappings
  +-- Log sync result (count updated, count added, errors)
```

### Caching

- Exercise data is stored in PostgreSQL after normalization — no runtime calls to external API during user sessions.
- Weekly cron re-sync updates the library without disrupting users.
- If external API is unavailable during sync: skip, log warning, serve existing cached data.

### Rate Limit Handling

```typescript
async function fetchAllExercises(): Promise<ExternalExercise[]> {
  const results: ExternalExercise[] = [];
  let offset = 0;
  const limit = 10;

  while (true) {
    await sleep(300); // 300ms delay between requests
    const batch = await fetchExerciseBatch(offset, limit);
    if (batch.length === 0) break;
    results.push(...batch);
    offset += limit;
  }

  return results;
}
```

---

## 9. AI Security

### Prompt Injection Prevention

- User-provided free text (exercise notes, goal descriptions) is **never** directly interpolated into AI prompts.
- Only structured data (IDs, enum values, pre-validated numbers) is sent in prompts.
- If natural-language input is required for the chat assistant, it is included as a separate `user` message turn, not embedded in the `system` prompt.

### Data Minimization

| Data Type | Sent to AI? |
|-----------|-----------|
| User ID | NEVER |
| Email | NEVER |
| Name | NEVER |
| Date of birth | NEVER (age range only) |
| Biological sex | NEVER |
| Exercise IDs | Yes (internal IDs only) |
| Exercise names | Yes (from our DB, not user input) |
| Aggregated stats | Yes (pre-calculated numbers) |
| Personal records | Yes (weight + exercise name) |
| Raw set logs | NEVER |

### AI Response Isolation

- AI responses are never stored in the database without user review and approval.
- AI responses are never used to populate another AI prompt without review (no opaque chaining).

---

## 10. AI Cost Controls

| Control | Implementation |
|---------|---------------|
| Per-user rate limit | 10 AI calls/hour via Upstash Redis |
| Daily budget alert | Monitor via AI provider dashboard + webhook |
| Token budget | Max 2000 input tokens + 500 output tokens per routine optimization call |
| Model selection | Use GPT-4o-mini or Gemini Flash for simple tasks; full model for optimization |
| Streaming | Use streaming for progress insights to improve perceived performance |
| Caching AI responses | NOT cached — suggestions must be fresh per request |

---

## 11. Failure Modes and Fallbacks

| Failure | User Experience | System Behavior |
|---------|----------------|----------------|
| AI provider 503 | Toast: "AI is temporarily unavailable" | Log error; return 503 from route |
| AI output fails Zod validation | Toast: "Couldn't analyze routine, please try again" | Log full AI output for debugging |
| AI returns hallucinated exercise IDs | Silent rejection; partial results shown | DB check filters out unknown IDs |
| Rate limit exceeded | Toast: "You've reached your AI limit for today" | Return 429 with retry-after |
| AI provider timeout (>10s) | Toast: "Request timed out" | Abort signal + 503 response |

**Key principle:** AI failure must never block the user from completing a workout or viewing their data.
