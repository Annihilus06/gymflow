# GymFlow — Database Architecture

**Version:** 1.0.0  
**Date:** 2026-08-24

---

## Table of Contents

1. [Entity Relationship Overview](#1-entity-relationship-overview)
2. [Prisma Schema](#2-prisma-schema)
3. [Table Descriptions](#3-table-descriptions)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Constraints and Integrity Rules](#5-constraints-and-integrity-rules)
6. [Migration Strategy](#6-migration-strategy)

---

## 1. Entity Relationship Overview

```
User
 ├── UserProfile          (1:1)
 ├── WeightLog            (1:N)
 ├── MealLog              (1:N)
 ├── Goal                 (1:N, at most 1 ACTIVE)
 ├── Routine              (1:N, at most 1 ACTIVE)
 │    └── RoutineDay        (1:7 per routine)
 │         └── RoutineDayExercise (1:N per day)
 ├── WorkoutSession       (1:N)
 │    └── ExerciseLog       (1:N per session)
 │         └── SetLog        (1:N per exercise log)
 └── PushSubscription     (1:N)

Exercise (global library, not user-specific)
 ├── ExerciseMuscle       (N:M through join table)
 └── MuscleGroup          (global reference table)

RoutineDayExercise ──> Exercise
ExerciseLog ──> Exercise
SetLog ──> ExerciseLog
```

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum WeightUnit {
  KG
  LB
}

enum Sex {
  MALE
  FEMALE
  OTHER
}

enum ActivityLevel {
  SEDENTARY
  LIGHTLY_ACTIVE
  MODERATELY_ACTIVE
  VERY_ACTIVE
  EXTRA_ACTIVE
}

enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum GoalType {
  WEIGHT_LOSS
  MUSCLE_GAIN
  STRENGTH_TARGET
  WORKOUT_FREQUENCY
  CUSTOM
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  EXPIRED
  ARCHIVED
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

enum ExerciseCategory {
  STRENGTH
  CARDIO
  FLEXIBILITY
  BALANCE
  PLYOMETRICS
}

// ============================================================
// USER & PROFILE
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  passwordHash  String?   // null for OAuth users
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile          UserProfile?
  accounts         Account[]
  sessions         AuthSession[]
  routines         Routine[]
  workoutSessions  WorkoutSession[]
  weightLogs       WeightLog[]
  mealLogs         MealLog[]
  goals            Goal[]
  pushSubscriptions PushSubscription[]

  @@map("users")
}

model UserProfile {
  id                  String          @id @default(cuid())
  userId              String          @unique
  dateOfBirth         DateTime?
  sex                 Sex?
  heightCm            Float?          // Always stored in cm
  weightUnit          WeightUnit      @default(KG)
  activityLevel       ActivityLevel   @default(MODERATELY_ACTIVE)
  experienceLevel     ExperienceLevel @default(BEGINNER)
  onboardingComplete  Boolean         @default(false)
  notificationsEnabled Boolean        @default(false)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model AuthSession {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("auth_sessions")
}

// ============================================================
// EXERCISE LIBRARY (Global)
// ============================================================

model Exercise {
  id           String           @id @default(cuid())
  externalId   String?          @unique
  name         String
  description  String?          @db.Text
  instructions String[]
  category     ExerciseCategory
  imageUrl     String?
  videoUrl     String?
  isCustom     Boolean          @default(false)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  muscles             ExerciseMuscle[]
  routineDayExercises RoutineDayExercise[]
  exerciseLogs        ExerciseLog[]

  @@index([name])
  @@index([category])
  @@map("exercises")
}

model MuscleGroup {
  id       String @id @default(cuid())
  name     String @unique
  bodyPart String

  exercises ExerciseMuscle[]

  @@map("muscle_groups")
}

model ExerciseMuscle {
  exerciseId    String
  muscleGroupId String
  isPrimary     Boolean @default(true)

  exercise    Exercise    @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  muscleGroup MuscleGroup @relation(fields: [muscleGroupId], references: [id], onDelete: Cascade)

  @@id([exerciseId, muscleGroupId])
  @@map("exercise_muscles")
}

// ============================================================
// ROUTINES
// ============================================================

model Routine {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  days RoutineDay[]

  @@index([userId, isActive])
  @@map("routines")
}

model RoutineDay {
  id        String    @id @default(cuid())
  routineId String
  dayOfWeek DayOfWeek
  label     String?
  isRestDay Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  routine   Routine              @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exercises RoutineDayExercise[]

  @@unique([routineId, dayOfWeek])
  @@index([routineId])
  @@map("routine_days")
}

model RoutineDayExercise {
  id              String   @id @default(cuid())
  routineDayId    String
  exerciseId      String
  displayOrder    Int
  defaultSets     Int      @default(3)
  defaultReps     Int      @default(10)
  defaultWeightKg Float?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  routineDay RoutineDay @relation(fields: [routineDayId], references: [id], onDelete: Cascade)
  exercise   Exercise   @relation(fields: [exerciseId], references: [id])

  @@unique([routineDayId, displayOrder])
  @@index([routineDayId])
  @@map("routine_day_exercises")
}

// ============================================================
// WORKOUT SESSIONS
// ============================================================

model WorkoutSession {
  id            String        @id @default(cuid())
  userId        String
  routineDayId  String?
  status        SessionStatus @default(IN_PROGRESS)
  startedAt     DateTime      @default(now())
  finishedAt    DateTime?
  durationSecs  Int?
  totalVolumeKg Float?
  notes         String?       @db.Text
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  exerciseLogs ExerciseLog[]

  @@index([userId, startedAt])
  @@index([userId, status])
  @@map("workout_sessions")
}

model ExerciseLog {
  id           String   @id @default(cuid())
  sessionId    String
  exerciseId   String
  displayOrder Int
  skipped      Boolean  @default(false)
  notes        String?
  createdAt    DateTime @default(now())

  session  WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exercise Exercise       @relation(fields: [exerciseId], references: [id])
  sets     SetLog[]

  @@index([sessionId])
  @@map("exercise_logs")
}

model SetLog {
  id               String   @id @default(cuid())
  exerciseLogId    String
  setNumber        Int
  targetReps       Int?
  actualReps       Int
  weightKg         Float    @default(0)
  isPersonalRecord Boolean  @default(false)
  notes            String?
  loggedAt         DateTime @default(now())
  idempotencyKey   String?  @unique

  exerciseLog ExerciseLog @relation(fields: [exerciseLogId], references: [id], onDelete: Cascade)

  @@index([exerciseLogId])
  @@map("set_logs")
}

// ============================================================
// BODY METRICS
// ============================================================

model WeightLog {
  id       String   @id @default(cuid())
  userId   String
  weightKg Float
  loggedAt DateTime @default(now())
  notes    String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, loggedAt])
  @@map("weight_logs")
}

// ============================================================
// GOALS
// ============================================================

model Goal {
  id           String     @id @default(cuid())
  userId       String
  type         GoalType
  status       GoalStatus @default(ACTIVE)
  title        String
  description  String?
  targetValue  Float?
  startValue   Float?
  currentValue Float?
  targetDate   DateTime?
  startedAt    DateTime   @default(now())
  completedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@map("goals")
}

// ============================================================
// NUTRITION
// ============================================================

model MealLog {
  id                String   @id @default(cuid())
  userId            String
  name              String
  estimatedCalories Int
  estimatedProteinG Float
  loggedAt          DateTime @default(now())
  notes             String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, loggedAt])
  @@map("meal_logs")
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint])
  @@map("push_subscriptions")
}
```

---

## 3. Table Descriptions

| Table | Purpose | Notes |
|-------|---------|-------|
| `users` | NextAuth user account | `passwordHash` null for OAuth |
| `user_profiles` | Fitness profile data | 1:1 with user; created at onboarding |
| `accounts` | NextAuth OAuth accounts | Multiple OAuth per user |
| `auth_sessions` | NextAuth sessions | JWT strategy; table mostly unused in JWT mode |
| `exercises` | Normalized exercise library | Seeded from external API; global (not per-user) |
| `muscle_groups` | Canonical muscle group reference | e.g., "Chest", "Quadriceps" |
| `exercise_muscles` | Exercise to muscle group mapping | isPrimary distinguishes primary/secondary |
| `routines` | User-defined weekly workout plans | At most 1 isActive per user |
| `routine_days` | Day-of-week slot in a routine | 7 per routine; unique (routineId, dayOfWeek) |
| `routine_day_exercises` | Exercise assigned to a routine day | Ordered by displayOrder |
| `workout_sessions` | A single workout execution instance | status: IN_PROGRESS / COMPLETED / ABANDONED |
| `exercise_logs` | Each exercise within a session | Linked to session |
| `set_logs` | Individual set data | idempotencyKey enables offline sync dedup |
| `weight_logs` | Body weight entries over time | Always in kg; display conversion in code |
| `goals` | User fitness goals | At most 1 ACTIVE per user (service enforced) |
| `meal_logs` | User-entered meals | Supplementary nutrition data |
| `push_subscriptions` | Web Push endpoint registration | Multiple devices per user |

---

## 4. Indexing Strategy

| Table | Index | Rationale |
|-------|-------|----------|
| `users` | `email` UNIQUE | Auth lookup |
| `routines` | `(userId, isActive)` | Dashboard: fetch active routine |
| `routine_days` | `(routineId)` | Fetch all days for a routine |
| `workout_sessions` | `(userId, startedAt)` | History pagination |
| `workout_sessions` | `(userId, status)` | Find in-progress session |
| `exercise_logs` | `(sessionId)` | Fetch all exercises for a session |
| `set_logs` | `(exerciseLogId)` | Fetch all sets for an exercise log |
| `set_logs` | `idempotencyKey` UNIQUE | Offline sync deduplication |
| `weight_logs` | `(userId, loggedAt)` | Weight chart queries |
| `goals` | `(userId, status)` | Active goal lookup |
| `meal_logs` | `(userId, loggedAt)` | Daily nutrition queries |
| `exercises` | `name` | Search |
| `exercises` | `category` | Filter |

---

## 5. Constraints and Integrity Rules

### Single Active Routine

Enforced at the **service layer** in a transaction:

```typescript
async function activateRoutine(userId: string, routineId: string) {
  await prisma.$transaction([
    prisma.routine.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    }),
    prisma.routine.update({
      where: { id: routineId, userId },
      data: { isActive: true }
    }),
  ]);
}
```

### Single Active Goal

Enforced at the **service layer** with a count check:

```typescript
async function createGoal(userId: string, data: CreateGoalInput) {
  const activeGoal = await prisma.goal.findFirst({
    where: { userId, status: 'ACTIVE' }
  });
  if (activeGoal) {
    throw new AppError('GOAL_ALREADY_ACTIVE', 'Archive your current goal first.');
  }
  return prisma.goal.create({ data: { ...data, userId } });
}
```

### Cascade Deletes

| Parent Deleted | Cascades to |
|---------------|------------|
| `User` | All user data (total account deletion) |
| `Routine` | `RoutineDay` -> `RoutineDayExercise` |
| `WorkoutSession` | `ExerciseLog` -> `SetLog` |
| `ExerciseLog` | `SetLog` |

### Data Integrity Rules

- `SetLog.weightKg` defaults to 0 (bodyweight exercises).
- `RoutineDayExercise.displayOrder` must be unique within a `routineDayId`.
- `UserProfile.heightCm` stored as Float (cm); display conversion in `/src/lib/utils/units.ts`.
- All timestamps stored as UTC.

---

## 6. Migration Strategy

### Development

```bash
prisma migrate dev --name <descriptive-name>
```

### Production

```bash
prisma migrate deploy
```

### Rules

1. **Never edit a migration file after it has been applied to any environment.**
2. **Schema changes require a new migration file** — do not modify `schema.prisma` without generating a migration.
3. **Additive changes preferred** — add nullable columns before requiring data backfill.
4. **Destructive changes** (dropping columns, tables) require a three-step migration:
   - Step 1: Deploy code that no longer reads the column.
   - Step 2: Migrate to drop the column.
   - Step 3: Remove any remaining dead references.
5. **Seed script** (`prisma/seed.ts`) populates the exercise library from the external API during initial setup.
6. **Connection pooling** — Use `DIRECT_URL` for migrations; `DATABASE_URL` should point to PgBouncer pooled connection.
