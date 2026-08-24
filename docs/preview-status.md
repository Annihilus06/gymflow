# GymFlow Product Preview Status Report

**Date:** 2026-08-24  
**Status:** Visual & Functional Preview Ready  
**Build & Typecheck:** 100% Passing (0 errors, 0 warnings)  
**Test Suites:** 34 Vitest test files passing (274 unit & integration tests), 49 Playwright browser tests passing.

---

## 1. Features Currently Working

### 1. Authentication & Profile
- **Registration**: Full email/password registration with bcrypt password hashing and client/server Zod validation.
- **Login & Logout**: Secure NextAuth v5 JWT session management and HttpOnly cookies.
- **Protected Routes**: Middleware enforcement protecting all `(app)/*` routes and redirecting unauthenticated users to `/login`.
- **Onboarding Flow**: Multi-step onboarding collecting biometric baseline (DOB, height, weight, activity level, goal, experience).
- **Settings & Profile**: Profile overview and edit endpoints.

### 2. Routine Builder & Planning
- **Weekly Routine Architecture**: 7-day schedule (Monday to Sunday) mapping to workout and recovery days.
- **Exercise Assignment & Management**: Assigning exercises, setting default sets, reps, and target weights.
- **Exercise Reordering**: Updating execution sequence within a day.
- **Routine Activation**: Enforcing single active routine per user.
- **Duplicate & Delete**: Routine duplication and deletion with cascade cleanup.

### 3. Workout Execution Mode
- **Session Lifecycle**: Starting scheduled or ad-hoc workouts, resuming active in-progress sessions, completing, and abandoning.
- **Live Execution UI**: Exercise-by-exercise focus view, set logging with weight and reps, live workout timer, and rest interval countdowns.
- **Idempotent Set Logging**: `X-Idempotency-Key` deduplication preventing duplicate sets upon network retries or offline syncing.
- **Personal Record (PR) Detection**: Automatic flagging when a logged set surpasses all-time historical bests.
- **Workout History**: Reverse chronological session logs with exercise breakdowns and volumes.

### 4. Exercise Library & External Integration
- **Exercise Directory**: Searchable, muscle-group filterable catalog of exercises.
- **Muscle & Equipment Normalization**: Standardized mappings to anatomy and gear.
- **Detail View & Instructions**: Step-by-step biomechanical execution instructions.
- **API Cache Engine**: 30-day PostgreSQL caching with rate-limiting throttling.

### 5. Workout Calendar & Scheduling
- **Dynamic Derivation**: Calendar states computed dynamically from user routine + dates + actual session completions.
- **Status System**: `TODAY`, `COMPLETED`, `UPCOMING`, `MISSED`, `REST`.
- **Interactive Month & Week Views**: Day selection revealing planned exercises and completion badges.
- **Timezone Resilience**: Pure UTC date boundary normalization avoiding day-shift bugs.

### 6. AI-Assisted Workout Optimization
- **Biomechanical Sequencing**: Compound multi-joint prioritisation over isolation movements.
- **Volume & Balance Warnings**: Alerting users to excessive junk volume ($> 20$ sets) or antagonist imbalances.
- **Strict Guardrails**: Zero direct DB writes (`RULE-AI-003`), full Zod output validation (`RULE-AI-002`), PII sanitization (`RULE-AI-004`), and explicit user confirmation diff modal.

### 7. Goal Management System
- **Single Active Goal Constraint**: Atomic transaction enforcement (`409 Conflict` on second active goal attempt).
- **Deterministic Progress Calculations**: Bounded $0 - 100\%$ progress math (`RULE-AI-001`).
- **Goal Types**: Weight Loss, Muscle Gain, Strength Target, Workout Frequency, Custom.
- **Goal History & Celebration**: Completion and cancellation workflows.

### 8. Analytics & Progress Engine
- **Completed-Only Derivation**: Analytics derived exclusively from actual verified completed workouts (`status: 'COMPLETED'`).
- **Weekly, Monthly, Yearly Summaries**: Planned vs completed count, frequency %, active day streak, total volume lifted, and total active training time.
- **Personal Records Showcase**: Top all-time lifts grouped by exercise.
- **Exercise Progression**: Historical performance over time.

### 9. Nutrition Calculation Engine
- **Scientific Models**: Mifflin-St Jeor BMR, Physical Activity Level (PAL) TDEE, WHO Standard BMI, and body weight protein ratios.
- **Medical Disclaimer**: Clear non-medical advice notice.
- **Daily Intake Progress**: Meal logging with calorie/protein tracking vs daily targets.

---

## 2. Features Partially Working / Next Phases

| Feature Area | Current State | Future Enhancement |
|---|---|---|
| **Weight Tracking (Stage 11)** | Weight logs captured in DB and latest weight displayed on dashboard. | Historical interactive line charts with time-window filtering. |
| **Offline Sync (Stage 14)** | Idempotency key architecture and service worker scaffold ready. | Dexie.js IndexedDB background queue sync for offline mode. |
| **Push Notifications (Stage 14)** | Notification schema ready in DB. | Web Push VAPID subscriptions and daily training reminders. |

---

## 3. Known UI & Backend Limitations

1. **Weight Progress Charting**: The weight trend chart belongs to Stage 11 and is not yet rendered as an interactive SVG/canvas.
2. **Offline Local Storage**: Currently uses live network API with server-side validation; full offline IndexedDB queue is scheduled for Stage 14.
3. **Single Active Goal Limitation**: Intentionally restricted to 1 active goal at a time per product specification.

---

## 4. What Remains for Stage 11 (Weight Tracking + BMI Analytics)

1. Implement `WeightService` with historical weight trends, moving averages, and delta rates (kg/week).
2. Implement `GET /api/weight` and `POST /api/weight` with timestamped logs and notes.
3. Build the dedicated Weight Section on `/progress` featuring interactive weight progress charts.
