# GymFlow — Product Requirements Document

**Version:** 1.0.0  
**Status:** Approved for Implementation  
**Date:** 2026-08-24  
**Authors:** Lead Software Architect

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Technology Stack](#3-technology-stack)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Feature Definitions](#6-feature-definitions)
7. [User Stories](#7-user-stories)
8. [Out of Scope](#8-out-of-scope)
9. [Assumptions](#9-assumptions)
10. [Risk Register](#10-risk-register)

---

## 1. Executive Summary

GymFlow is a production-grade, mobile-first fitness tracking and workout planning application. It enables users to define weekly gym routines, track workout execution, monitor body metrics, set and pursue fitness goals, and receive AI-assisted workout optimization — all within a secure, offline-capable Progressive Web App.

---

## 2. Product Vision

**For** health-conscious individuals who work out regularly,  
**GymFlow** is a fitness platform  
**that** replaces paper logs and fragmented tracking apps with a single intelligent system for planning, executing, and analyzing workouts.

### Guiding Principles

| Principle | Meaning |
|-----------|---------|
| Mobile-first | Primary design target is a 375px-wide phone screen |
| Offline-first | Core features work without an internet connection |
| Data sovereignty | Users own their data; no cross-user leakage is possible |
| AI as advisor | AI provides suggestions; code computes all authoritative values |
| Accessible by default | WCAG 2.1 AA compliance from day one |

---

## 3. Technology Stack

| Layer | Technology | Version Constraint |
|-------|-----------|-------------------|
| Framework | Next.js App Router | >= 14 |
| Language | TypeScript | strict mode, >= 5.0 |
| UI Library | React | >= 18 |
| Component System | shadcn/ui + Radix UI | latest stable |
| Styling | Tailwind CSS | >= 3 |
| Database | PostgreSQL | >= 15 |
| ORM | Prisma | >= 5 |
| Authentication | NextAuth.js v5 (Auth.js) | >= 5 |
| AI | Vercel AI SDK + provider (OpenAI / Google) | structured outputs |
| Exercise Data | ExerciseDB (RapidAPI) or WGER REST API | normalized + cached |
| PWA | next-pwa or custom service worker | — |
| Testing | Jest + React Testing Library + Playwright | — |
| Deployment | Vercel (primary), containerizable | — |

---

## 4. Functional Requirements

### FR-001 — User Onboarding and Profile

- The system **shall** allow users to register with email/password or OAuth (Google).
- The system **shall** collect onboarding data: name, date of birth, biological sex, height, current weight, fitness goal, activity level, and experience level.
- The system **shall** persist onboarding answers and skip onboarding on subsequent logins.
- The system **shall** allow users to update profile data at any time.
- The system **shall** calculate age deterministically from date of birth at runtime.

### FR-002 — Weekly Gym Routine

- The system **shall** allow users to define a named weekly routine (e.g., "Push/Pull/Legs").
- The system **shall** allow users to assign workout types or rest days to each day of the week (Monday–Sunday).
- The system **shall** allow users to create multiple routines but only one may be **active** at a time.
- The system **shall** allow the user to switch active routines.
- Users **shall** be able to add exercises to each routine day from the exercise library.
- Users **shall** be able to reorder exercises within a day.
- Users **shall** be able to set default sets, reps, and weight for each exercise in the routine.

### FR-003 — Weekly Muscle-Group Schedule

- The system **shall** display which primary muscle groups are trained on each day of the active routine.
- The system **shall** derive muscle group data from attached exercises (normalized from external API).
- The system **shall** highlight imbalances (e.g., no posterior chain work all week) via a visual indicator.

### FR-004 — Calendar View

- The system **shall** display a monthly calendar.
- The system **shall** visually distinguish workout days, rest days, and completed workout days.
- The system **shall** allow users to navigate between months.
- Clicking a past or future calendar day **shall** open that day's exercises in read/log mode.
- Today's date **shall** be highlighted prominently.

### FR-005 — Today's Workout

- The system **shall** display the current day's workout on the home/dashboard screen.
- If today is a rest day, a rest day card **shall** be shown.
- The system **shall** show exercise count, estimated duration, and muscle groups for today.
- The system **shall** provide a prominent "Start Workout" action.

### FR-006 — Exercise Detail

- Tapping an exercise **shall** open a detail sheet with: name, description, muscle groups (primary + secondary), instructions, and a demonstration.
- The system **shall** source exercise data from the normalized exercise library.

### FR-007 — AI-Assisted Routine Optimization

- The system **shall** provide an AI-powered routine analysis on demand.
- AI **shall** return structured JSON: suggested exercise order, flagged imbalances, substitution suggestions with rationale.
- AI output **shall** be validated against a Zod schema before being shown to the user.
- The user **must explicitly approve** any AI-suggested change before it is persisted.
- AI **shall not** directly write to the database.

### FR-008 — Workout Execution Mode

- The system **shall** present a focused, step-by-step workout execution UI.
- The system **shall** display one exercise at a time with its target sets/reps/weight.
- The system **shall** allow users to mark each set as complete with actual reps and weight.
- The system **shall** allow users to skip an exercise.
- The system **shall** allow users to add notes per exercise during execution.
- The system **shall** track elapsed workout duration.
- The system **shall** allow users to finish or abandon a workout.

### FR-009 — Set / Rep / Weight Tracking

- Each completed set **shall** store: exercise ID, set number, target reps, actual reps, weight (kg), timestamp, and notes.
- The system **shall** show previous performance for each exercise during execution.
- Weight units **shall** be configurable per user (kg / lb); conversions done in code.

### FR-010 — Workout History

- The system **shall** list all completed workouts in reverse chronological order.
- Each history entry **shall** be expandable to show all sets logged.
- The system **shall** allow users to filter history by date range, muscle group, and exercise.
- The system **shall** allow users to delete a logged workout session (with confirmation).

### FR-011 — Statistics

- **Weekly:** total volume (kg lifted), workout count, duration, most-trained muscle group.
- **Monthly:** above + trend vs. prior month.
- **Yearly:** above + personal records (PRs) per exercise, total workouts vs. goal.
- All statistics **shall** be computed in deterministic code, never by AI.

### FR-012 — Workout Frequency Percentage

- Formula: `(completed_workout_days / scheduled_workout_days) * 100`.
- Implemented as a pure function in the service layer.

### FR-013 — Goal System

- A user **shall** have at most one active goal at any time.
- Supported goal types: weight loss, muscle gain, strength target, workout frequency, and custom text goal.
- Each goal **shall** have: type, target value, start date, target date, and a progress snapshot.
- The system **shall** display a progress bar for the active goal.
- On goal completion, the system **shall** prompt the user to set a new goal.
- Old goals **shall** be archived and viewable in history.

### FR-014 — Weight Tracking

- Users can log body weight with a date and optional note.
- The system **shall** display a line chart of weight over time.

### FR-015 — BMI Calculation

- BMI formula: `weight_kg / (height_m)^2`
- Computed in a deterministic utility function, never by AI.
- BMI category displayed alongside the value.

### FR-016 — Daily Calorie Estimation

- BMR via Mifflin-St Jeor equation in code.
- TDEE = BMR x deterministic activity factor.
- Calorie targets adjusted for goal type using defined constants.

### FR-017 — Daily Protein Estimation

- Protein target: 1.6–2.2 g/kg body weight, selected by goal type.
- Implemented as a pure utility function.

### FR-018 — Nutrition Progress

- Daily calorie and protein targets displayed alongside user-logged intake.
- Users can manually log meals (name, estimated calories, estimated protein).

### FR-019 — PWA / Mobile Optimization

- Installable as a PWA on iOS Safari and Android Chrome.
- Service worker for offline asset caching.
- Offline core: view today's workout, view exercise library, log sets.

### FR-020 — Notifications / Reminders

- Push notification permission requested during onboarding (skippable).
- Workout reminders at user-defined times for scheduled days.
- In-app notifications for goal completions and PRs.

### FR-021 — Offline-Friendly Functionality

- IndexedDB for local offline state.
- Sets logged offline sync to server on reconnect.
- Connectivity status indicator.
- Conflict resolution: last-write-wins with server-side timestamp.

---

## 5. Non-Functional Requirements

### NFR-001 — Performance

| Metric | Target |
|--------|--------|
| Largest Contentful Paint (LCP) | <= 2.5 s on 4G |
| First Input Delay (FID) | <= 100 ms |
| Cumulative Layout Shift (CLS) | <= 0.1 |
| API p95 response time | <= 300 ms (cached routes) |
| Database query p95 | <= 100 ms |

### NFR-002 — Security

- All routes protected by authentication middleware.
- Row-level security: every query includes `userId` in `WHERE` clause.
- All input validated with Zod before processing.
- Secrets never exposed to client.
- HTTPS-only in production.
- HTTP security headers: CSP, HSTS, X-Frame-Options.

### NFR-003 — Reliability

- 99.5% uptime target.
- Graceful degradation when exercise API is unavailable.

### NFR-004 — Scalability

- Schema supports multi-tenancy (all tables include `userId`).
- Caching reduces load on read-heavy routes.

### NFR-005 — Accessibility

- WCAG 2.1 AA compliance.
- Keyboard navigation works for all core workflows.
- ARIA roles applied to dynamic content.

### NFR-006 — Maintainability

- All modules < 300 lines.
- Business logic in `/src/lib/services/`.
- Pure utilities in `/src/lib/utils/`.
- No `any` types without explicit justification comment.

---

## 6. Feature Definitions

### Feature: Onboarding (FR-001)

**Purpose:** Collect minimum user data to personalise calculations and UI.

**Inputs:** Name, date of birth, biological sex, height (cm), current weight, fitness goal type, activity level, experience level.

**Outputs:** Persisted `User` + `UserProfile` record; redirect to dashboard.

**DB Dependencies:** `User`, `UserProfile`

**Edge Cases:**
- User navigates away mid-onboarding — partial data must not persist.
- Future date of birth — validated server-side (age 13–120).
- Height/weight outside physiological range — reject with validation error.
- OAuth user — profile pre-filled from OAuth provider.

**Acceptance Criteria:**
- AC1: Onboarding completable in < 3 minutes.
- AC2: Invalid data shows inline errors without page reload.
- AC3: Dashboard renders with personalised data after onboarding.

**Tests:**
- Unit: `validateOnboardingInput()` rejects invalid DOB, height, weight.
- Integration: POST `/api/profile/onboard` persists correct data.
- E2E: Full onboarding flow via Playwright.

---

### Feature: Workout Execution (FR-008)

**Purpose:** Distraction-free mode for executing a planned workout with real-time set logging.

**Inputs:** Active routine day exercises, "Start Workout" action.

**Outputs:** Completed `WorkoutSession` with `ExerciseLog` and `SetLog` records.

**DB Dependencies:** `WorkoutSession`, `ExerciseLog`, `SetLog`, `RoutineDay`, `RoutineDayExercise`

**Edge Cases:**
- App closed mid-workout — session auto-saved as draft; user can resume.
- User logs 0 sets — session marked abandoned.
- Network lost during workout — offline queue handles set writes.

**Acceptance Criteria:**
- AC1: "Start Workout" creates `WorkoutSession` immediately.
- AC2: Each set completion writes `SetLog` within 500 ms (online) or queues offline.
- AC3: Finishing marks session `status: COMPLETED`.
- AC4: Previous performance visible for every exercise.

**Tests:**
- Unit: `computeWorkoutVolume()`, `computeFrequency()`.
- Integration: POST `/api/sessions`, PATCH `/api/sessions/:id`.
- E2E: Start → log sets → finish.

---

### Feature: Statistics (FR-011)

**Purpose:** Meaningful progress data across time horizons.

**Inputs:** `userId`, `period` (week | month | year), `referenceDate`.

**Outputs:** `{ totalVolume, workoutCount, totalDuration, muscleGroupBreakdown, personalRecords }`.

**Edge Cases:**
- No data for period — return zeroed stats, not error.
- Weight unit must be respected.

**Acceptance Criteria:**
- AC1: Stats render within 500 ms for 1 year of data.
- AC2: Volume shown in user's preferred weight unit.

**Tests:**
- Unit: `aggregateWeeklyStats()`, `findPersonalRecords()`.
- Integration: GET `/api/stats?period=week`.

---

### Feature: Goal System (FR-013)

**Purpose:** Focused, measurable motivation aligned to the user's fitness objective.

**Inputs:** Goal type, target value, target date.

**Outputs:** `Goal` record; progress bar data on dashboard.

**Edge Cases:**
- Second active goal attempt — reject; offer to archive current.
- Target date passes without completion — mark `EXPIRED`.
- Weight-loss goal with no weight logs — progress indeterminate; prompt to log.

**Acceptance Criteria:**
- AC1: Only one `status: ACTIVE` goal per user (DB constraint + service check).
- AC2: Progress bar computed from authoritative data, not AI.
- AC3: Goal completion triggers celebration animation and prompt.

**Tests:**
- Unit: `computeGoalProgress()` for each goal type.
- Integration: POST `/api/goals` rejects second active goal.
- E2E: Set goal → achieve → celebrate → set new goal.

---

## 7. User Stories

```
US-001: As a new user, I want to complete onboarding quickly so I can start my first workout the same day.
US-002: As a gym-goer, I want to define my weekly PPL split so the app knows my schedule.
US-003: As a user, I want to see today's workout on my home screen without navigating.
US-004: As a user, I want to log each set with actual reps and weight so I can track progress.
US-005: As a user, I want to see my last performance for each exercise so I can aim to beat it.
US-006: As a user, I want the app to work offline at the gym where connectivity is poor.
US-007: As a user, I want AI to suggest a better exercise order, which I can accept or reject.
US-008: As a user, I want to track my bodyweight over time and see my BMI.
US-009: As a user, I want a single active goal with a progress bar so I stay focused.
US-010: As a user, I want workout reminders at my chosen time so I don't skip sessions.
US-011: As a user, I want to install the app on my phone home screen for quick access.
US-012: As a user, I want to view my workout history to see how I've progressed.
US-013: As a user, I want monthly statistics to understand my training consistency.
```

---

## 8. Out of Scope (v1.0)

- Social features (friends, sharing, leaderboards)
- Video hosting for exercise demonstrations (link to YouTube)
- Custom exercise creation (v1.1)
- Barcode scanning for food logging
- Integration with wearables (Apple Watch, Garmin)
- Multi-language support (architecture must support it)
- In-app payments / subscription tiers
- Trainer–client relationships

---

## 9. Assumptions

| # | Assumption |
|---|-----------|
| A1 | The exercise API (ExerciseDB or WGER) provides sufficient free-tier data to seed the library. |
| A2 | AI calls are made via Vercel AI SDK using OpenAI GPT-4o or Google Gemini with structured output. |
| A3 | Push notifications use the Web Push API; no native SDK required for v1. |
| A4 | Weight unit is a user preference; the database always stores values in kg. |
| A5 | All time is stored in UTC; display converted to user's local timezone client-side. |
| A6 | Mifflin-St Jeor equation used for BMR; activity factors defined as named constants. |
| A7 | "Biological sex" collected for BMR accuracy, not for identity; optional and privacy-sensitive. |
| A8 | Offline sync conflicts resolved with last-write-wins using server timestamps. |

---

## 10. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|-----------|
| R1 | Exercise API rate limits or downtime | Medium | High | Normalize and cache; fall back to local cache |
| R2 | AI API cost overrun | Medium | Medium | Per-user daily AI call limits; token budgets |
| R3 | PWA offline sync conflicts causing data loss | Low | High | Idempotent sync with server-side conflict resolution |
| R4 | AI returns malformed output | Medium | Medium | Validate AI outputs with Zod; reject and fall back |
| R5 | GDPR/data privacy compliance gap | Low | High | Data deletion endpoint; no PII in logs |
| R6 | Database performance degradation at scale | Low | Medium | Composite indexes; connection pooling via PgBouncer |
| R7 | Push notifications blocked by iOS Safari | High | Low | Fall back to in-app reminders; document to user |
