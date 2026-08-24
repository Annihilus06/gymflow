# GymFlow — System Architecture

**Version:** 1.0.0  
**Date:** 2026-08-24

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Folder Architecture](#2-folder-architecture)
3. [Layer Architecture](#3-layer-architecture)
4. [Service-Layer Architecture](#4-service-layer-architecture)
5. [Authentication & Authorization Architecture](#5-authentication--authorization-architecture)
6. [PWA Architecture](#6-pwa-architecture)
7. [Caching Strategy](#7-caching-strategy)
8. [Error-Handling Strategy](#8-error-handling-strategy)
9. [Validation Strategy](#9-validation-strategy)
10. [Security Model](#10-security-model)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Dependency Graph](#12-dependency-graph)
13. [Development Roadmap](#13-development-roadmap)

---

## 1. System Overview

```
+------------------------------------------------------------------+
|                    CLIENT (Browser / PWA)                        |
|  Next.js App Router (React 18)  | Service Worker | IndexedDB    |
+------------------+-----------------------------------------------+
                   | HTTPS
+------------------v-----------------------------------------------+
|                  NEXT.JS SERVER (Vercel Edge/Node)               |
|  App Router (RSC) | Route Handlers | Auth Middleware             |
|  Server Actions   | Vercel AI SDK  | Rate Limiter                |
+--------+-----------------------+----------------------------------+
         |                       |
+--------v--------+   +----------v------------------------------------+
|   PostgreSQL    |   |            External Services                  |
|  (via Prisma)   |   |  OpenAI / Gemini API  |  ExerciseDB API      |
|  PgBouncer pool |   |  Web Push (VAPID)     |  WGER REST API       |
+-----------------+   +-----------------------------------------------+
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------| 
| Rendering strategy | RSC + Client components | Server components for data fetching; client for interactivity |
| API layer | Next.js Route Handlers | Colocation with framework; avoid separate API server |
| State management | React Query (TanStack Query) | Server-state sync, caching, offline support |
| Form management | React Hook Form + Zod | Type-safe validation; minimal re-renders |
| Offline storage | Dexie.js (IndexedDB) | Typed, promise-based IndexedDB wrapper |
| Push notifications | Web Push API (VAPID) | No native SDK required; works on modern mobile browsers |

---

## 2. Folder Architecture

```
gymflow/
├── .env.local                    # Environment variables (never committed)
├── .env.example                  # Template for required env vars
├── next.config.ts                # Next.js configuration + PWA
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript strict config
├── prisma/
│   ├── schema.prisma             # Prisma schema (single source of truth)
│   ├── migrations/               # Auto-generated migration files
│   └── seed.ts                   # Exercise library seed script
├── public/
│   ├── manifest.json             # PWA Web App Manifest
│   ├── sw.js                     # Service Worker (compiled)
│   ├── icons/                    # PWA icons (192, 512 px)
│   └── exercises/                # Cached exercise images
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Route group: unauthenticated
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                # Route group: authenticated
│   │   │   ├── layout.tsx        # Auth guard + shell layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Today's workout + goal progress
│   │   │   ├── workout/
│   │   │   │   ├── page.tsx      # Routine management
│   │   │   │   ├── execute/
│   │   │   │   │   └── page.tsx  # Workout execution mode
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx  # Session review
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx      # Calendar view
│   │   │   ├── history/
│   │   │   │   └── page.tsx      # Workout history
│   │   │   ├── exercises/
│   │   │   │   ├── page.tsx      # Exercise library
│   │   │   │   └── [exerciseId]/
│   │   │   │       └── page.tsx  # Exercise detail
│   │   │   ├── progress/
│   │   │   │   └── page.tsx      # Stats + weight + BMI
│   │   │   ├── goals/
│   │   │   │   └── page.tsx      # Goal management
│   │   │   ├── nutrition/
│   │   │   │   └── page.tsx      # Nutrition tracking
│   │   │   └── settings/
│   │   │       └── page.tsx      # User settings + preferences
│   │   ├── api/                  # Route Handlers
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── profile/
│   │   │   │   ├── route.ts      # GET, PATCH
│   │   │   │   └── onboard/route.ts
│   │   │   ├── routines/
│   │   │   │   ├── route.ts
│   │   │   │   └── [routineId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── activate/route.ts
│   │   │   │       └── days/[dayId]/
│   │   │   │           ├── route.ts
│   │   │   │           └── exercises/route.ts
│   │   │   ├── sessions/
│   │   │   │   ├── route.ts
│   │   │   │   └── [sessionId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── sets/route.ts
│   │   │   │       └── finish/route.ts
│   │   │   ├── exercises/
│   │   │   │   ├── route.ts
│   │   │   │   └── [exerciseId]/route.ts
│   │   │   ├── stats/route.ts
│   │   │   ├── goals/
│   │   │   │   ├── route.ts
│   │   │   │   └── [goalId]/route.ts
│   │   │   ├── weight/
│   │   │   │   ├── route.ts
│   │   │   │   └── [entryId]/route.ts
│   │   │   ├── nutrition/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── optimize/route.ts
│   │   │   │   ├── insights/route.ts
│   │   │   │   └── substitute/route.ts
│   │   │   └── push/
│   │   │       └── subscribe/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Shell, nav, header
│   │   ├── dashboard/
│   │   ├── workout/
│   │   ├── calendar/
│   │   ├── exercises/
│   │   ├── progress/
│   │   ├── goals/
│   │   ├── nutrition/
│   │   └── shared/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.ts         # NextAuth configuration
│   │   │   └── middleware.ts     # Route protection
│   │   ├── db/
│   │   │   └── prisma.ts         # Prisma singleton client
│   │   ├── services/             # Business logic layer
│   │   │   ├── profile.service.ts
│   │   │   ├── routine.service.ts
│   │   │   ├── session.service.ts
│   │   │   ├── exercise.service.ts
│   │   │   ├── stats.service.ts
│   │   │   ├── goal.service.ts
│   │   │   ├── weight.service.ts
│   │   │   ├── nutrition.service.ts
│   │   │   └── ai.service.ts
│   │   ├── utils/                # Pure utility functions
│   │   │   ├── bmi.ts
│   │   │   ├── calories.ts
│   │   │   ├── protein.ts
│   │   │   ├── frequency.ts
│   │   │   ├── volume.ts
│   │   │   ├── units.ts
│   │   │   ├── dates.ts
│   │   │   └── goals.ts
│   │   ├── validations/          # Zod schemas
│   │   │   ├── profile.schema.ts
│   │   │   ├── routine.schema.ts
│   │   │   ├── session.schema.ts
│   │   │   ├── goal.schema.ts
│   │   │   ├── weight.schema.ts
│   │   │   ├── nutrition.schema.ts
│   │   │   └── ai.schema.ts
│   │   ├── ai/
│   │   │   ├── client.ts
│   │   │   ├── prompts.ts
│   │   │   └── guards.ts
│   │   ├── exercise-api/
│   │   │   ├── client.ts
│   │   │   ├── normalizer.ts
│   │   │   └── cache.ts
│   │   ├── push/
│   │   │   └── webpush.ts
│   │   └── offline/
│   │       ├── queue.ts
│   │       └── db.ts
│   ├── hooks/
│   │   ├── useWorkout.ts
│   │   ├── useGoal.ts
│   │   ├── useStats.ts
│   │   ├── useOfflineSync.ts
│   │   └── useNotifications.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── ai.ts
│   └── constants/
│       ├── activity-factors.ts
│       ├── protein-ratios.ts
│       ├── bmi-categories.ts
│       └── muscle-groups.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

---

## 3. Layer Architecture

```
+------------------------------------------+
|         Presentation Layer               |
|  React Components + shadcn/ui + Hooks    | <- No business logic
+------------------+-----------------------+
                   |
+------------------v-----------------------+
|         API Layer                        |
|  Next.js Route Handlers                  | <- Auth check, Zod validation, response shaping
+------------------+-----------------------+
                   |
+------------------v-----------------------+
|         Service Layer                    |
|  /src/lib/services/*.service.ts          | <- Business logic, orchestration
+------------------+-----------------------+
                   |
+------------------v-----------------------+
|         Data Layer                       |
|  Prisma ORM + PostgreSQL                 | <- Queries, transactions
+-----------------------------------------+

Cross-Cutting:
+------------------------------------------+
|  Utils: Pure functions (no side effects) |
|  Validations: Zod schemas               |
|  Constants: Named values                |
+------------------------------------------+
```

### Layer Rules

1. **Presentation Layer** — May import from hooks, types, constants, and UI components only. No direct Prisma or service imports.
2. **API Layer** — Authenticates the request, validates input via Zod, calls service layer, shapes response. No raw SQL or Prisma in route handlers.
3. **Service Layer** — Contains all business logic. Calls Prisma directly. Calls utility functions for calculations. Never imports from React components or route handlers.
4. **Utils** — Pure functions. No side effects. No imports from other layers. All deterministic calculations live here.
5. **AI** — Isolated in `ai.service.ts`. AI calls are always async, always validated, always advisory.

---

## 4. Service-Layer Architecture

### ProfileService

| Method | Responsibility |
|--------|---------------|
| `createProfile(userId, data)` | Create initial user profile post-registration |
| `updateProfile(userId, data)` | Update user preferences and metrics |
| `getProfile(userId)` | Fetch full profile with latest weight |
| `completeOnboarding(userId, data)` | Atomic onboarding transaction |
| `computeMetrics(profile)` | Return BMI, BMR, TDEE, protein target |

### RoutineService

| Method | Responsibility |
|--------|---------------|
| `createRoutine(userId, data)` | Create a new routine |
| `activateRoutine(userId, routineId)` | Deactivate current, activate new |
| `getActiveRoutine(userId)` | Fetch active routine with days and exercises |
| `addExerciseToDay(userId, dayId, exerciseId, defaults)` | Add exercise with position |
| `reorderExercises(userId, dayId, orderedIds)` | Update display order |
| `getTodayWorkout(userId, date)` | Map today's DOW to routine day |

### SessionService

| Method | Responsibility |
|--------|---------------|
| `startSession(userId, routineDayId)` | Create WorkoutSession record |
| `logSet(userId, sessionId, data)` | Append SetLog; check ownership |
| `finishSession(userId, sessionId)` | Mark COMPLETED; compute volume |
| `abandonSession(userId, sessionId)` | Mark ABANDONED |
| `getSessionHistory(userId, filters)` | Paginated history |
| `getLastPerformance(userId, exerciseId)` | Previous sets for exercise |

### StatsService

| Method | Responsibility |
|--------|---------------|
| `getWeeklyStats(userId, weekStart)` | Aggregate sessions for the week |
| `getMonthlyStats(userId, year, month)` | Aggregate sessions for the month |
| `getYearlyStats(userId, year)` | Aggregate sessions for the year |
| `getPersonalRecords(userId)` | Best set per exercise ever |
| `getFrequencyPercentage(userId, period)` | Completed / scheduled * 100 |

### GoalService

| Method | Responsibility |
|--------|---------------|
| `createGoal(userId, data)` | Create goal; enforce single-active rule |
| `updateGoalProgress(userId, goalId)` | Recompute progress from source data |
| `archiveGoal(userId, goalId)` | Mark COMPLETED or EXPIRED |
| `getActiveGoal(userId)` | Fetch current active goal with progress |

### AIService

| Method | Responsibility |
|--------|---------------|
| `optimizeRoutine(userId, routineId)` | Build prompt, call AI, validate output |
| `getProgressInsights(userId)` | Build prompt, call AI, return insights |
| `suggestSubstitute(exerciseId, constraints)` | Suggest alternatives |
| `validateAIOutput(schema, raw)` | Zod parse; throw on failure |

---

## 5. Authentication & Authorization Architecture

### Authentication Flow

```
User -> Login Page
         |
         v
   NextAuth.js v5
   +------------------+
   | Email/Pass       |-> bcrypt verify -> DB lookup -> JWT session
   | Google OAuth     |-> OAuth flow   -> DB upsert  -> JWT session
   +------------------+
         |
         v
   Middleware (matcher: /(app)/(.*))
   +--------------------------------+
   | validate session token         |
   | redirect to /login if invalid  |
   +--------------------------------+
         |
         v
   Route Handler / Server Component
   +--------------------------------+
   | const session = await auth()  |
   | if (!session) return 401      |
   | userId = session.user.id      |
   +--------------------------------+
```

### Authorization Rules

| Rule | Implementation |
|------|---------------|
| Every data query includes `userId` | Service layer always receives `userId` from route handler; Prisma `where` always includes it |
| AI cannot determine authorization | `userId` injected by server after session validation; AI never receives raw user IDs |
| Admin routes | Separate `(admin)` route group with role check middleware |
| API keys never on client | All external API calls (AI, ExerciseDB) made server-side |

### Session Strategy

- **Strategy:** JWT (stateless) — scales to Vercel serverless.
- **Session data:** `{ id, email, name, onboardingComplete }`.
- **Token rotation:** 15-minute access token; 7-day refresh token.
- **CSRF protection:** NextAuth handles via double-submit cookie pattern.

---

## 6. PWA Architecture

### Service Worker Cache Strategy

| Resource Type | Cache Strategy | Cache Name |
|--------------|----------------|------------|
| App shell (HTML, CSS, JS) | Cache First | `gymflow-shell-v1` |
| Exercise images | Stale While Revalidate | `gymflow-exercises-v1` |
| API responses (today's workout) | Network First, fallback to cache | `gymflow-api-v1` |
| AI responses | Network only (no cache) | — |
| User-written data (sets) | Background sync via offline queue | — |

### Offline Queue

```
User logs a set (offline)
        |
        v
 IndexedDB (Dexie) — OfflineQueue table
 { id, action, payload, timestamp, synced: false }
        |
        v (on reconnect)
 Background Sync API / polling on focus
        |
        v
 POST /api/sessions/:id/sets (with idempotency key)
        |
        v
 Mark queue item synced: true
```

### Web App Manifest

```json
{
  "name": "GymFlow",
  "short_name": "GymFlow",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#22c55e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 7. Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Exercise library | PostgreSQL (seeded) | Permanent (re-sync weekly) | Manual re-sync or cron |
| Today's workout | React Query client cache | 5 minutes | Workout start or session complete |
| Statistics | React Query | 1 minute | Session finish |
| User profile | React Query | Until mutation | Profile update |
| External exercise API | In-memory (server) | 24 hours | Cron weekly re-sync |
| AI responses | No cache | — | Never cached |
| Service worker assets | Cache Storage (browser) | Until SW version bump | New deployment |

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minute
      gcTime: 5 * 60 * 1000,     // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 8. Error-Handling Strategy

### Error Classification

| Class | HTTP Code | User Message | Logging |
|-------|-----------|-------------|--------|
| Validation error | 400 | Field-level messages from Zod | No |
| Authentication error | 401 | "Please log in" | No |
| Authorization error | 403 | "You don't have access" | Yes (anomaly) |
| Not found | 404 | "Not found" | No |
| AI service error | 503 | "AI unavailable, try again" | Yes |
| External API error | 503 | "Exercise data unavailable" | Yes |
| Database error | 500 | "Something went wrong" | Yes (critical) |
| Rate limit | 429 | "Too many requests" | Yes |

### Error Structure

```typescript
interface APIError {
  code: string;         // e.g. 'VALIDATION_ERROR'
  message: string;      // User-facing message
  details?: unknown;    // Zod error details (dev only)
  requestId?: string;   // Correlation ID for log lookup
}
```

### Client Error Handling

- React Query `onError` callbacks display toast notifications.
- Error boundaries wrap major page sections to prevent full-page crashes.
- Offline state shows a banner; queued actions show pending indicators.

---

## 9. Validation Strategy

### Principle: Validate at the Boundary

All data entering the system — from users, from AI, from external APIs — is validated before being processed or persisted.

### Validation Points

| Boundary | Validation Tool | When |
|----------|----------------|------|
| Form input | React Hook Form + Zod (client-side) | On blur + on submit |
| API request body | Zod (server-side, in route handler) | Before calling service |
| API query params | Zod (server-side) | Before calling service |
| AI output | Zod (server-side, in ai.service.ts) | After every AI call |
| External API response | Zod (server-side, in normalizer.ts) | After every API call |
| Environment variables | Zod (at startup in env.ts) | On app boot |

---

## 10. Security Model

### Threat Model

| Threat | Control |
|--------|--------|
| Unauthenticated access | Auth middleware on all `(app)/*` routes |
| Horizontal privilege escalation | `userId` always in query `WHERE` clause |
| SQL injection | Prisma parameterized queries |
| XSS | React DOM escaping + CSP header |
| CSRF | NextAuth double-submit cookie |
| Secret leakage | Server-side only env vars; no `NEXT_PUBLIC_` for secrets |
| AI prompt injection | System prompt hardened; user input sanitized before inclusion |
| AI data leakage | User PII stripped from AI prompts; only anonymized metrics sent |
| Rate limiting | Upstash Redis rate limiter on AI routes |
| Brute force | NextAuth built-in rate limiting; CAPTCHA on register |

### HTTP Security Headers

```typescript
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: buildCSP() },
];
```

### Data Privacy

- No PII logged to server logs.
- GDPR: `/api/profile/export` and `/api/profile/delete` endpoints.
- Workout data never sent to AI without explicit user consent.

---

## 11. Deployment Architecture

```
+------------------------------------------------------------+
|                     Vercel Platform                        |
|  Next.js (Edge RSC/HTML)  |  Serverless Functions (Node)  |
|                           |  API Route Handlers            |
+---------------------------+-------+------------------------+
                                    |
+-----------------------------------v------------------------+
|              Neon / Supabase / Railway                    |
|  PostgreSQL 15  |  PgBouncer (connection pooling)         |
+------------------------------------------------------------+

Optional:
+------------------------------------------------------------+
|                     Upstash Redis                          |
|  Rate limiting  |  Session caching  |  Pub/Sub (future)   |
+------------------------------------------------------------+
```

### Environment Variables

```
DATABASE_URL=          # Prisma connection string (pooled)
DIRECT_URL=            # Direct connection (for migrations)
NEXTAUTH_SECRET=       # NextAuth JWT signing secret
NEXTAUTH_URL=          # App canonical URL
GOOGLE_CLIENT_ID=      # OAuth
GOOGLE_CLIENT_SECRET=  # OAuth
OPENAI_API_KEY=        # AI provider
EXERCISE_API_KEY=      # ExerciseDB RapidAPI key
VAPID_PUBLIC_KEY=      # Web Push
VAPID_PRIVATE_KEY=     # Web Push
UPSTASH_REDIS_URL=     # Rate limiting (optional)
UPSTASH_REDIS_TOKEN=   # Rate limiting (optional)
```

---

## 12. Dependency Graph

```
Presentation Layer
  └─> hooks/
        └─> react-query (TanStack Query)
              └─> API Layer (Route Handlers)
                    ├─> auth/ (NextAuth)
                    ├─> validations/ (Zod)
                    └─> services/
                          ├─> db/ (Prisma -> PostgreSQL)
                          ├─> utils/ (pure functions)
                          ├─> ai/ (Vercel AI SDK -> OpenAI/Gemini)
                          ├─> exercise-api/ (ExerciseDB/WGER)
                          └─> push/ (Web Push)
```

### Key External Dependencies

| Package | Purpose | Risk if Unavailable |
|---------|---------|-------------------|
| next | Framework | Critical |
| @prisma/client | ORM | Critical |
| next-auth | Authentication | Critical |
| @tanstack/react-query | Server state | High |
| ai (Vercel AI SDK) | AI integration | Low (AI features degraded) |
| dexie | IndexedDB | Medium (offline broken) |
| zod | Validation | Critical |
| react-hook-form | Forms | Medium |
| web-push | Push notifications | Low (notifications disabled) |

---

## 13. Development Roadmap

### Phase 0 — Foundation (Agent 1–3)
- Project scaffold with Next.js, TypeScript, Tailwind, shadcn/ui
- Prisma schema + PostgreSQL connection
- NextAuth authentication (email + Google)
- Middleware and route protection
- Base layout, navigation shell, PWA manifest

### Phase 1 — Core Workout (Agent 4–8)
- Exercise library (seed from external API)
- Routine builder (CRUD + day assignment)
- Workout execution mode
- Set/rep/weight logging
- Today's workout on dashboard

### Phase 2 — Tracking and History (Agent 9–11)
- Workout history
- Calendar view
- Statistics (weekly, monthly, yearly)
- Personal records

### Phase 3 — Body and Goals (Agent 12–14)
- Weight tracking + chart
- BMI display
- Goal system (create, track, complete)
- Calorie and protein estimation

### Phase 4 — AI and Smart Features (Agent 15–17)
- AI routine optimization
- AI progress insights
- Exercise substitution suggestions
- Muscle group imbalance detection

### Phase 5 — PWA and Offline (Agent 18–19)
- Service worker implementation
- Offline set logging queue
- Push notification reminders
- Sync conflict resolution

### Phase 6 — Polish and Production (Agent 20–21)
- WCAG 2.1 AA audit
- Performance optimization
- E2E test suite
- Security audit
- Deployment pipeline
