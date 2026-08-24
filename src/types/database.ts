import type {
  User,
  UserProfile,
  Account,
  AuthSession,
  Exercise,
  MuscleGroup,
  ExerciseMuscle,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  WorkoutSession,
  ExerciseLog,
  SetLog,
  WeightLog,
  Goal,
  MealLog,
  PushSubscription,
  DayOfWeek,
  WeightUnit,
  Sex,
  ActivityLevel,
  ExperienceLevel,
  GoalType,
  GoalStatus,
  SessionStatus,
  ExerciseCategory,
} from '@prisma/client';

export type {
  User,
  UserProfile,
  Account,
  AuthSession,
  Exercise,
  MuscleGroup,
  ExerciseMuscle,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  WorkoutSession,
  ExerciseLog,
  SetLog,
  WeightLog,
  Goal,
  MealLog,
  PushSubscription,
  DayOfWeek,
  WeightUnit,
  Sex,
  ActivityLevel,
  ExperienceLevel,
  GoalType,
  GoalStatus,
  SessionStatus,
  ExerciseCategory,
};

/**
 * Extended Routine type with days and ordered exercises.
 */
export type RoutineWithDays = Routine & {
  days: (RoutineDay & {
    exercises: (RoutineDayExercise & {
      exercise: Exercise;
    })[];
  })[];
};

/**
 * Extended WorkoutSession type with exercise logs and sets.
 */
export type WorkoutSessionWithLogs = WorkoutSession & {
  exerciseLogs: (ExerciseLog & {
    exercise: Exercise;
    sets: SetLog[];
  })[];
};

/**
 * Goal with computed progress percentage.
 */
export type GoalWithProgress = Goal & {
  progressPct: number;
  daysRemaining?: number;
};
