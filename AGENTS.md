# AGENTS.md — GymFlow Coding Agent Rules

**Version:** 1.0.0  
**Status:** MANDATORY — All agents must read and follow this document before writing any code.
**Date:** 2026-08-24

---

## Table of Contents

1. [Agent Mission](#1-agent-mission)
2. [Mandatory Architecture Rules](#2-mandatory-architecture-rules)
3. [AI Rules — Hard Boundaries](#3-ai-rules--hard-boundaries)
4. [TypeScript Rules](#4-typescript-rules)
5. [Security Rules](#5-security-rules)
6. [Database Rules](#6-database-rules)
7. [API Rules](#7-api-rules)
8. [Frontend Rules](#8-frontend-rules)
9. [Testing Rules](#9-testing-rules)
10. [File and Module Rules](#10-file-and-module-rules)
11. [Agent-by-Agent Implementation Plan](#11-agent-by-agent-implementation-plan)
12. [Contradiction Check](#12-contradiction-check)
13. [Missing Requirements](#13-missing-requirements)
14. [Technical Risks](#14-technical-risks)
15. [Security Risks](#15-security-risks)
16. [External API Dependencies](#16-external-api-dependencies)
17. [Where AI Must NOT Be Used](#17-where-ai-must-not-be-used)

---

## 1. Agent Mission

You are implementing **GymFlow**, a production-grade, mobile-first fitness tracking PWA.

Before writing any code:
1. Read `/docs/product-spec.md` for requirements.
2. Read `/docs/architecture.md` for system and folder structure.
3. Read `/docs/database.md` for the Prisma schema.
4. Read `/docs/api.md` for API conventions.
5. Read `/docs/ai-spec.md` if implementing AI features.
6. Read `/docs/testing.md` for testing requirements.
7. Read your specific phase in Section 11 of this document.

**Do not skip documentation review. Do not deviate from the architecture without a documented reason.**

---

## 2. Mandatory Architecture Rules

### RULE-ARCH-001: Layer Separation

Business logic MUST NOT live in React components or API route handlers.

```typescript
// FORBIDDEN:
// app/(app)/dashboard/page.tsx
const bmi = weight / ((height / 100) ** 2); // WRONG: business logic in component

// CORRECT:
// lib/utils/bmi.ts
export function calculateBMI(weightKg: number, heightCm: number): number | null { ... }
// app/(app)/dashboard/page.tsx
import { calculateBMI } from '@/lib/utils/bmi';
```

### RULE-ARCH-002: Route Handler Pattern

Every route handler MUST follow this exact pattern:

```typescript
export async function POST(req: Request) {
  // 1. Auth check — ALWAYS FIRST
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Please log in' }, { status: 401 });
  }
  // 2. Parse + validate input with Zod
  const body = await req.json();
  const parsed = SomeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  // 3. Call service layer — pass userId from session, NEVER from request
  const result = await someService.doSomething(session.user.id, parsed.data);
  // 4. Return shaped response
  return Response.json(result, { status: 201 });
}
```

### RULE-ARCH-003: userId Must Come From Session

`userId` MUST always be extracted from `session.user.id`. It MUST NEVER be accepted as a query parameter, URL segment, or request body field.

### RULE-ARCH-004: Service Layer Must Include userId in All Queries

```typescript
// FORBIDDEN — missing userId in WHERE clause
const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });

// CORRECT — always scope to user
const session = await prisma.workoutSession.findUnique({
  where: { id: sessionId, userId },
});
```

### RULE-ARCH-005: No Direct Prisma Access in Components or Route Handlers

Route handlers call services. Services call Prisma. Components call hooks. Hooks call route handlers via React Query.

---

## 3. AI Rules — Hard Boundaries

### RULE-AI-001: AI Must Never Calculate Health Metrics

| Metric | File | Function |
|--------|------|----------|
| BMI | `src/lib/utils/bmi.ts` | `calculateBMI()` |
| BMR | `src/lib/utils/calories.ts` | `calculateBMR()` |
| TDEE | `src/lib/utils/calories.ts` | `calculateTDEE()` |
| Calorie target | `src/lib/utils/calories.ts` | `calculateCalorieTarget()` |
| Protein target | `src/lib/utils/protein.ts` | `calculateProteinTarget()` |
| Workout volume | `src/lib/utils/volume.ts` | `calculateVolume()` |
| Frequency % | `src/lib/utils/frequency.ts` | `calculateFrequencyPercentage()` |
| Goal progress | `src/lib/utils/goals.ts` | `computeGoalProgress()` |

### RULE-AI-002: All AI Output Must Be Validated With Zod

```typescript
// FORBIDDEN: using AI output directly without validation
const aiResult = await generateObject({ ... });
await prisma.routine.update({ data: aiResult }); // NEVER

// CORRECT: validate first, return to client for approval
const aiResult = await generateObject({ ... });
const validated = RoutineOptimizationOutputSchema.parse(aiResult.object);
return Response.json(validated); // user approves, THEN a separate route writes to DB
```

### RULE-AI-003: AI Must Not Write to the Database

`ai.service.ts` MUST NOT import from `@/lib/db/prisma`. AI output flows: AI -> Zod validation -> route handler response -> client -> user approval -> separate route handler writes to DB.

### RULE-AI-004: Strip PII Before Any AI Prompt

Use `sanitizeUserContextForAI()` from `src/lib/ai/guards.ts` before building any prompt. Never include: userId, email, name, exact DOB, passwordHash, or biological sex.

### RULE-AI-005: AI Failure Must Not Block Core Features

Every AI feature must have a functional code path that works without AI. AI errors return 503 with a user-friendly message and must not prevent workout logging or data viewing.

---

## 4. TypeScript Rules

### RULE-TS-001: Strict Mode Required

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### RULE-TS-002: No `any` Without Justification Comment

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacy: any = externalLib.unknownOutput(); // Reason: external lib lacks types
```

### RULE-TS-003: Infer Types from Prisma

```typescript
import type { WorkoutSession, SetLog } from '@prisma/client';
// Do not redefine DB shapes manually
```

### RULE-TS-004: Use Zod for Runtime Types

```typescript
const CreateGoalSchema = z.object({ ... });
type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
```

### RULE-TS-005: Return Types on All Service Functions

```typescript
async function getActiveGoal(userId: string): Promise<GoalWithProgress | null> { ... }
```

---

## 5. Security Rules

### RULE-SEC-001: Never Expose Secrets to Client
- All API keys (AI, ExerciseDB, VAPID private) MUST be server-side only env vars.
- No `NEXT_PUBLIC_` prefix for any secret.

### RULE-SEC-002: Validate All Input
Every data entry point MUST be parsed through a Zod schema before use.

### RULE-SEC-003: Use HTTP Security Headers
`next.config.ts` MUST configure: Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Content-Security-Policy.

### RULE-SEC-004: No PII in Logs
Never log: email, name, passwordHash, dateOfBirth, sex.
Log only: userId (for correlation), operation name, result, duration.

### RULE-SEC-005: GDPR Endpoints Must Exist Before Launch
- `GET /api/profile/export` — JSON export of all user data
- `DELETE /api/profile` — Hard delete all user data and account

---

## 6. Database Rules

### RULE-DB-001: All User Tables Must Include userId
Every table that stores user-generated data MUST have a `userId` FK to `users.id` with `onDelete: Cascade`.

### RULE-DB-002: Store All Weights in kg
DB always stores kg. Display conversion (kg <-> lb) in `/src/lib/utils/units.ts`.

### RULE-DB-003: Store All Heights in cm
DB always stores cm. Display conversion in `units.ts`.

### RULE-DB-004: Store All Timestamps in UTC
Use `DateTime @default(now())`. Client-side timezone conversion via the `Intl` API.

### RULE-DB-005: Use Transactions for Multi-Step Writes
Any atomic operation MUST use `prisma.$transaction()`.

### RULE-DB-006: Never Modify Migration Files After Application
Migration files are immutable once applied. Create new migrations for schema changes.

### RULE-DB-007: Always Generate Migrations for Schema Changes
Never edit `schema.prisma` without running `prisma migrate dev`.

---

## 7. API Rules

### RULE-API-001: Route Handler File Structure
Only export named HTTP method functions. No helpers in route files.

### RULE-API-002: Consistent Error Shape
```typescript
{ code: string; message: string; details?: unknown; requestId?: string }
```

### RULE-API-003: Never Return 403 for Resource Not Found
Return `404 Not Found` when a user tries to access another user's resource (prevents user enumeration).

### RULE-API-004: Idempotency Key for Set Logging
`POST /api/sessions/:id/sets` MUST check `X-Idempotency-Key` header. Duplicate key returns 200 with existing set.

### RULE-API-005: Pagination on All List Endpoints
All list endpoints MUST support cursor-based pagination with `cursor` and `limit` query parameters.

---

## 8. Frontend Rules

### RULE-FE-001: Mobile-First CSS
```
CORRECT:   className="text-sm sm:text-base lg:text-lg"
FORBIDDEN: className="text-lg max-sm:text-sm"
```

### RULE-FE-002: Accessible Components
- Icon-only buttons: use `aria-label`.
- Form inputs: use `<label>` or `aria-label`.
- Dynamic content: use `aria-live="polite"`.
- Progress bars: use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

### RULE-FE-003: No Business Logic in Components
Components must not contain BMI, calorie, frequency, goal progress calculations. These belong in `utils/` or `services/`.

### RULE-FE-004: Use React Query for Server State
All server data fetching (except RSC) MUST use TanStack React Query.

### RULE-FE-005: Error Boundaries Required
Each major page section MUST be wrapped in a React `ErrorBoundary` component.

---

## 9. Testing Rules

### RULE-TEST-001: No Live API Calls in Tests
No test may make a live network request to AI APIs, exercise APIs, or production databases.

### RULE-TEST-002: Unit Test All Utils at 100% Branch Coverage
Every function in `src/lib/utils/` MUST have 100% branch coverage.

### RULE-TEST-003: Test Authorization Separately
Every API endpoint that reads/writes user data MUST have a test verifying a different user cannot access it.

### RULE-TEST-004: Test the Single Active Goal Constraint
`POST /api/goals` MUST have an integration test that verifies creating a second active goal returns 409.

### RULE-TEST-005: Test Offline Idempotency
The offline set logging path MUST have an E2E test verifying duplicate sets with the same idempotency key are not created.

---

## 10. File and Module Rules

### RULE-MODULE-001: Max 300 Lines Per File
Split files that exceed 300 lines.

### RULE-MODULE-002: Prefer Named Exports
Default exports only for Next.js page/layout components (framework requirement).

### RULE-MODULE-003: JSDoc on All Exported Functions
```typescript
/**
 * Calculates BMI using the standard formula: weight(kg) / height(m)^2
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns BMI value, or null if height is 0
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null { ... }
```

### RULE-MODULE-004: Import Aliases
```typescript
import { calculateBMI } from '@/lib/utils/bmi'; // CORRECT
import { calculateBMI } from '../../../lib/utils/bmi'; // FORBIDDEN
```

### RULE-MODULE-005: Constants in constants/
```typescript
// FORBIDDEN: magic numbers
const tdee = bmr * 1.55;
// CORRECT: named constant
import { ACTIVITY_FACTORS } from '@/constants/activity-factors';
const tdee = bmr * ACTIVITY_FACTORS.MODERATELY_ACTIVE;
```

---

## 11. Agent-by-Agent Implementation Plan

### Agent 1 — Project Scaffold
**Tasks:** Initialize Next.js 14 + TypeScript strict mode + Tailwind + shadcn/ui. Configure tsconfig paths. Set up next.config.ts with security headers. Create .env.example. Configure ESLint + Prettier. Create full folder structure per docs/architecture.md Section 2. Create src/constants/ files.
**Deliverables:** `npm run dev` runs with no errors; full folder structure in place.
**Tests:** `tsc --noEmit` passes; `npm run lint` passes.

---

### Agent 2 — Database + Prisma
**Tasks:** Install Prisma. Configure datasource with DATABASE_URL and DIRECT_URL. Implement full Prisma schema from docs/database.md. Run `prisma migrate dev --name init`. Create singleton Prisma client in src/lib/db/prisma.ts.
**Deliverables:** Migration succeeds; Prisma studio shows all tables; client generates without errors.
**Tests:** Create/read/delete user and profile via test script.

---

### Agent 3 — Authentication
**Tasks:** Install next-auth@5. Configure auth with email+password (bcrypt) and Google OAuth, JWT strategy. Create route handler. Implement middleware protecting all (app)/* routes. Build login/register pages with React Hook Form + Zod. Implement shell layout with mobile nav.
**Deliverables:** Register, login, logout work. Unauthenticated users redirect to /login.
**Tests:** E2E: e2e/auth.spec.ts.

---

### Agent 4 — Onboarding + Profile
**Tasks:** Multi-step onboarding form. Collect name, DOB, sex, height, weight, goal, activity level, experience. Implement POST /api/profile/onboard. Implement ProfileService. Implement bmi.ts, calories.ts, protein.ts utils with full tests. Implement GET/PATCH /api/profile. Implement settings page.
**Deliverables:** Onboarding completes; dashboard shows personalised metrics.
**Tests:** ALL utils at 100% branch coverage. Integration: POST /api/profile/onboard. E2E: e2e/onboarding.spec.ts.

---

### Agent 5 — Exercise Library
**Tasks:** Implement ExerciseDB API client with rate limiting. Implement normalizer.ts. Implement ExerciseService.syncFromExternalAPI(). Create prisma/seed.ts. Seed muscle_groups. Implement GET /api/exercises (search, filter, pagination) and GET /api/exercises/:id. Implement exercise library and detail pages.
**Deliverables:** Seed populates >100 exercises. Exercise library is browsable and searchable.
**Tests:** Unit: normalizer functions. Integration: exercise list and detail endpoints.

---

### Agent 6 — Routine Builder
**Tasks:** Implement RoutineService (all methods). Implement all routine API routes. Implement routine list + create/edit pages. Implement day editor (assign exercises, set defaults, reorder). Implement muscle group schedule view. Implement activate routine route. Implement getTodayWorkout() by day-of-week.
**Deliverables:** User can create routine, assign exercises, activate it.
**Tests:** Integration: routine CRUD; activate; reorder; authorization.

---

### Agent 7 — Today's Workout + Dashboard
**Tasks:** Implement dashboard RSC. Fetch today's workout via RoutineService. Display workout card with exercise count, muscle groups, estimated duration, Start Workout CTA. Show rest day card. Show active goal progress bar. Show computed metrics (BMI, calorie target, protein target — from code not AI).
**Deliverables:** Dashboard renders correctly for workout days and rest days.
**Tests:** E2E: e2e/dashboard.spec.ts.

---

### Agent 8 — Workout Execution Mode
**Tasks:** Implement SessionService (all methods). Implement all session API routes. Implement execute/page.tsx focus UI. Display exercises one at a time; show previous performance. Implement set logging form. Implement workout timer. Implement skip, notes, finish, abandon. Implement PR detection. Implement volume.ts and frequency.ts utils.
**Deliverables:** Full workout execution flow works; sets logged; session completed.
**Tests:** Unit: calculateVolume(), calculateFrequencyPercentage(). Integration: start session, log set (idempotency), finish session, authorization. E2E: e2e/workout-execution.spec.ts.

---

### Agent 9 — Workout History + Calendar
**Tasks:** Implement GET /api/sessions with pagination and filtering. Implement history page (reverse chronological, expandable, deletable). Implement calendar page (workout/rest/completed day indicators, month navigation). Clicking a day opens that day's exercises.
**Deliverables:** History and calendar accurately reflect user data.
**Tests:** Integration: session list pagination, filtering. E2E: e2e/history.spec.ts, e2e/calendar.spec.ts.

---

### Agent 10 — Statistics
**Tasks:** Implement StatsService (weekly, monthly, yearly, PRs, frequency%). Implement GET /api/stats and GET /api/stats/records. Implement progress page with charts. Respect user weight unit preference. Zero-data periods return zeroed stats.
**Deliverables:** Stats page shows accurate aggregated data.
**Tests:** Unit: aggregateWeeklyStats(), findPersonalRecords(). Integration: GET /api/stats for all periods.

---

### Agent 11 — Weight Tracking + BMI
**Tasks:** Implement WeightService. Implement weight log API routes. Implement weight section on progress page with line chart. Display BMI from calculateBMI() utility using latest weight + profile height. Display BMI category badge.
**Deliverables:** Weight log and chart work; BMI always computed from code.
**Tests:** Unit: calculateBMI() at 100% branch coverage. Integration: weight CRUD.

---

### Agent 12 — Goal System
**Tasks:** Implement GoalService (all methods). Implement goals.ts util with computeGoalProgress() for each GoalType. Implement all goal API routes. Implement goals page. Display goal progress bar on dashboard. Implement goal completion celebration UI. Enforce single active goal (409 on second creation).
**Deliverables:** Goal system works end-to-end; single active goal enforced.
**Tests:** Unit: computeGoalProgress() at 100% branch coverage. Integration: 409 on second active goal. E2E: e2e/goals.spec.ts.

---

### Agent 13 — Nutrition Tracking
**Tasks:** Implement NutritionService. Implement calories.ts and protein.ts if not done. Implement nutrition API routes. Implement nutrition page with progress bars and meal log form. Verify all targets computed from code, never AI.
**Deliverables:** Nutrition page shows daily targets and logged intake.
**Tests:** Unit: calculateBMR(), calculateTDEE(), calculateCalorieTarget(), calculateProteinTarget() at 100% coverage. Integration: GET /api/nutrition/targets values match code.

---

### Agent 14 — Notifications + PWA
**Tasks:** Create public/manifest.json. Implement service worker with cache strategies per docs/architecture.md. Configure next.config.ts for PWA. Implement Dexie.js offline queue (src/lib/offline/). Implement useOfflineSync hook. Implement offline set logging with idempotency sync. Implement Web Push subscription. Implement notification preferences.
**Deliverables:** App installs on iOS/Android; offline logging syncs; push notifications work.
**Tests:** E2E: e2e/offline.spec.ts, e2e/pwa.spec.ts.

---

### Agent 15 — AI Features
**Tasks:** Implement ai/client.ts (Vercel AI SDK, provider abstraction). Implement ai/guards.ts (sanitizeUserContextForAI). Implement ai/prompts.ts. Implement ai.schema.ts (Zod schemas for all AI outputs). Implement AIService (all methods, Zod validation on all outputs). Implement all /api/ai/* routes with rate limiting. Implement AI optimization review UI (diff view). Implement insights display. Implement exercise substitution in workout execution. Implement Upstash Redis rate limiter.
**Deliverables:** All AI features work; all outputs Zod-validated; user must approve before DB writes; AI failure shows graceful error.
**Tests:** Unit: Zod schemas reject malformed AI output. Integration: 503 on AI failure, 429 on rate limit, 200 on success. Verify ai.service.ts has no Prisma imports. E2E: e2e/ai-optimize.spec.ts.

---

### Agent 16 — Accessibility, Security Audit + GDPR
**Tasks:** Run axe-core on all pages; fix all critical/serious violations. Audit all route handlers for auth checks. Audit all service methods for userId in queries. Implement GET /api/profile/export and DELETE /api/profile. Verify HTTP security headers. Add aria-live to dynamic content. Verify keyboard navigation for workout execution. Performance audit: LCP < 2.5s.
**Deliverables:** Zero critical axe violations; all auth routes verified; GDPR endpoints working.

---

### Agent 17 — Production Deployment
**Tasks:** Configure Vercel project with all env vars. Configure production PostgreSQL (Neon/Supabase). Run prisma migrate deploy. Run prisma db seed. Configure Upstash Redis. Configure VAPID keys. Run production smoke test. Update README.md.
**Deliverables:** Production deployment live; all smoke tests pass.

---

## 12. Contradiction Check

| Potential Contradiction | Resolution |
|------------------------|-----------|
| JWT sessions (stateless) vs. database sessions for NextAuth | Use JWT strategy. AuthSession table exists for compatibility but JWT is primary. |
| AI cannot write to DB, but AI route handlers need to return data | AI output: AI -> Zod validation -> route handler response -> client -> user approval -> separate PATCH/PUT writes to DB. No contradiction. |
| last-write-wins offline sync may cause data loss | Documented known limitation (Assumption A8). Acceptable for v1. Revisit in v1.1. |
| Single active routine enforced by service, not DB constraint | Intentional: better UX (service explains why before rejecting). Partial DB index is a v1.1 improvement. |
| ExerciseDB free tier limits vs. seeding 1300+ exercises | Rate-limited fetch with 300ms delay. Seed runs once, not on every deploy. |

---

## 13. Missing Requirements

| Gap | Decision |
|-----|---------|
| No routine yet — what does dashboard show? | Show "Create your first routine" onboarding card. |
| Estimated duration formula | (exercises * 4 sets * 45s rest) + (sets * 30s). Exposed as a utility function. |
| Can users edit completed session sets? | Yes, via PATCH /api/sessions/:id/sets/:setId. Editing rechecks for PRs. |
| Equipment options for AI substitution | Fixed enum in UserProfile: BARBELL, DUMBBELL, CABLES, BODYWEIGHT_ONLY, FULL_GYM. In settings page. |
| How are push reminders scheduled? | Vercel Cron Jobs trigger a daily API route that sends push notifications. |
| Completed vs. abandoned definition | COMPLETED: at least 1 set logged + user taps Finish. ABANDONED: 0 sets or user taps Abandon. ABANDONED sessions excluded from statistics. |

---

## 14. Technical Risks

| Risk | Severity | Mitigation |
|------|---------|-----------|
| ExerciseDB free tier quota exhaustion during seeding | High | 300ms rate limiting; WGER fallback; seed once, cache permanently |
| Vercel serverless cold start latency on AI routes | Medium | Keep AI route handlers lean; use edge runtime for non-AI routes |
| IndexedDB unavailable in private mode Safari | Medium | Detect; show warning; disable offline logging gracefully |
| Prisma connection pool exhaustion on Vercel serverless | High | Use PgBouncer (Neon/Supabase); set connection_limit=1 in DATABASE_URL for serverless |
| Dexie.js offline queue growing unbounded | Medium | Max queue size 100 items; alert user if sync failing; allow manual clear |
| Web Push unreliable on iOS before iOS 16.4 | High | Document minimum iOS 16.4; fall back to in-app reminders |

---

## 15. Security Risks

| Risk | Severity | Control |
|------|---------|--------|
| Cross-user resource access via guessed CUID | High | userId always in Prisma WHERE clause |
| AI prompt injection via exercise names | Medium | Only structured data (IDs, enums, validated numbers) in prompts |
| Push subscription endpoint spoofing | Medium | Subscription stored with userId; server sends to user's own endpoints only |
| JWT token theft | Medium | HttpOnly cookies via NextAuth; HTTPS-only in production |
| Malicious URL in exercise imageUrl from external API | Low | URL validated during normalization; CSP restricts image sources |
| GDPR data export containing excess info | Low | Audit export endpoint; strip internal IDs |

---

## 16. External API Dependencies

| Dependency | Purpose | Fallback |
|-----------|---------|---------|
| ExerciseDB (RapidAPI) | Exercise library source | WGER REST API |
| WGER REST API | Exercise library fallback | Cached DB data |
| OpenAI API (GPT-4o) | AI suggestions | Google Gemini (configurable via AI_PROVIDER env var) |
| Google Gemini API | AI suggestions alternative | OpenAI |
| Vercel AI SDK | AI abstraction layer | N/A |
| Web Push API (browser) | Push notifications | In-app reminders |
| Upstash Redis | Rate limiting | In-memory (degraded) |
| Neon / Supabase / Railway | PostgreSQL hosting | Any Postgres 15+ provider |

---

## 17. Where AI Must NOT Be Used

| Area | Use Instead |
|------|------------|
| BMI calculation | `src/lib/utils/bmi.ts::calculateBMI()` |
| BMR calculation | `src/lib/utils/calories.ts::calculateBMR()` |
| TDEE calculation | `src/lib/utils/calories.ts::calculateTDEE()` |
| Daily calorie target | `src/lib/utils/calories.ts::calculateCalorieTarget()` |
| Daily protein target | `src/lib/utils/protein.ts::calculateProteinTarget()` |
| Statistics aggregation | `src/lib/services/stats.service.ts` |
| Personal record detection | `src/lib/services/stats.service.ts::findPersonalRecords()` |
| Workout frequency % | `src/lib/utils/frequency.ts::calculateFrequencyPercentage()` |
| Goal progress % | `src/lib/utils/goals.ts::computeGoalProgress()` |
| User authentication | NextAuth.js |
| Authorization decisions | `auth()` + Prisma `where: { userId }` |
| Database writes | Services call Prisma; AI never calls Prisma |
| Weight unit conversion | `src/lib/utils/units.ts` |
| Date/age calculations | `src/lib/utils/dates.ts` |
| Nutrition progress bars | Code comparison of logged intake vs. target |

---

*End of AGENTS.md — GymFlow v1.0.0*
