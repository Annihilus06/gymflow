import prisma from '@/lib/db/prisma';
import {
  formatDateISO,
  createLocalDate,
  getDayOfWeekEnum,
  getMonthGrid,
  getWeekDays,
  deriveDayStatus,
  type CalendarDayStatus,
} from '@/lib/utils/calendar';
import type { DayOfWeek } from '@/types/database';

export interface CalendarExerciseItem {
  id: string;
  name: string;
  category: string;
  displayOrder: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number | null;
  notes: string | null;
  primaryMuscle: string | null;
}

export interface CalendarDayEvent {
  dateStr: string;
  dayNumber: number;
  dayOfWeek: DayOfWeek;
  isCurrentMonth: boolean;
  isToday: boolean;
  status: CalendarDayStatus;
  label: string | null;
  isRestDay: boolean;
  exerciseCount: number;
  exercises: CalendarExerciseItem[];
  completedSessionId?: string | null;
  finishedAt?: string | null;
}

export interface MonthlyScheduleResponse {
  year: number;
  month: number;
  todayStr: string;
  activeRoutine: {
    id: string;
    name: string;
  } | null;
  grid: CalendarDayEvent[];
}

export interface WeeklyScheduleResponse {
  startDate: string;
  endDate: string;
  todayStr: string;
  activeRoutine: {
    id: string;
    name: string;
  } | null;
  days: CalendarDayEvent[];
}

export class CalendarService {
  /**
   * Generates a complete monthly calendar grid with dynamically derived workout events and statuses.
   */
  static async getMonthlySchedule(
    userId: string,
    year: number,
    month: number,
    todayOverrideStr?: string
  ): Promise<MonthlyScheduleResponse> {
    const todayStr = todayOverrideStr || formatDateISO(new Date());

    // 1. Fetch user's active routine
    const activeRoutine = await prisma.routine.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          include: {
            exercises: {
              orderBy: { displayOrder: 'asc' },
              include: {
                exercise: {
                  include: {
                    muscles: {
                      include: {
                        muscleGroup: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 2. Generate calendar matrix days
    const gridDays = getMonthGrid(year, month);
    const startDate = gridDays[0]?.dateStr ? createLocalDate(gridDays[0].dateStr) : new Date(year, month - 1, 1);
    const endDate = gridDays[gridDays.length - 1]?.dateStr
      ? createLocalDate(gridDays[gridDays.length - 1]!.dateStr)
      : new Date(year, month, 0);

    // 3. Fetch completed workout sessions in this date window
    const completedSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: startDate,
          lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // end of day
        },
      },
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    // Index completed sessions by YYYY-MM-DD
    const completedSessionMap = new Map<string, { id: string; finishedAt: Date | null }>();
    for (const session of completedSessions) {
      const sessionDateStr = formatDateISO(new Date(session.startedAt));
      completedSessionMap.set(sessionDateStr, {
        id: session.id,
        finishedAt: session.finishedAt,
      });
    }

    // 4. Combine active routine + dates + completed status
    const grid: CalendarDayEvent[] = gridDays.map((gridDay) => {
      const scheduledDay = activeRoutine?.days.find((d) => d.dayOfWeek === gridDay.dayOfWeek);
      const isRestDay = scheduledDay ? scheduledDay.isRestDay : true;
      const label = scheduledDay?.label ?? (isRestDay ? 'Rest' : 'Workout');
      const isWorkoutDay = !!scheduledDay && !scheduledDay.isRestDay;
      const completedSession = completedSessionMap.get(gridDay.dateStr);
      const hasCompletedWorkout = !!completedSession;

      const status = deriveDayStatus({
        dateStr: gridDay.dateStr,
        todayStr,
        isRestDay,
        hasCompletedWorkout,
        isWorkoutDay,
      });

      const exercises: CalendarExerciseItem[] =
        scheduledDay && !isRestDay
          ? scheduledDay.exercises.map((de) => ({
              id: de.id,
              name: de.exercise.name,
              category: de.exercise.category,
              displayOrder: de.displayOrder,
              defaultSets: de.defaultSets,
              defaultReps: de.defaultReps,
              defaultWeightKg: de.defaultWeightKg,
              notes: de.notes,
              primaryMuscle:
                de.exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
            }))
          : [];

      return {
        dateStr: gridDay.dateStr,
        dayNumber: gridDay.dayNumber,
        dayOfWeek: gridDay.dayOfWeek,
        isCurrentMonth: gridDay.isCurrentMonth,
        isToday: gridDay.dateStr === todayStr,
        status,
        label,
        isRestDay,
        exerciseCount: exercises.length,
        exercises,
        completedSessionId: completedSession?.id ?? null,
        finishedAt: completedSession?.finishedAt ? completedSession.finishedAt.toISOString() : null,
      };
    });

    return {
      year,
      month,
      todayStr,
      activeRoutine: activeRoutine
        ? {
            id: activeRoutine.id,
            name: activeRoutine.name,
          }
        : null,
      grid,
    };
  }

  /**
   * Generates a 7-day weekly schedule window with full workout details.
   */
  static async getWeeklySchedule(
    userId: string,
    referenceDateStr?: string,
    todayOverrideStr?: string
  ): Promise<WeeklyScheduleResponse> {
    const todayStr = todayOverrideStr || formatDateISO(new Date());
    const refDate = referenceDateStr ? createLocalDate(referenceDateStr) : new Date();

    const activeRoutine = await prisma.routine.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          include: {
            exercises: {
              orderBy: { displayOrder: 'asc' },
              include: {
                exercise: {
                  include: {
                    muscles: {
                      include: {
                        muscleGroup: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const weekDays = getWeekDays(refDate);
    const startDate = createLocalDate(weekDays[0]!.dateStr);
    const endDate = createLocalDate(weekDays[weekDays.length - 1]!.dateStr);

    const completedSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: startDate,
          lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    const completedSessionMap = new Map<string, { id: string; finishedAt: Date | null }>();
    for (const session of completedSessions) {
      const sessionDateStr = formatDateISO(new Date(session.startedAt));
      completedSessionMap.set(sessionDateStr, {
        id: session.id,
        finishedAt: session.finishedAt,
      });
    }

    const days: CalendarDayEvent[] = weekDays.map((wDay) => {
      const scheduledDay = activeRoutine?.days.find((d) => d.dayOfWeek === wDay.dayOfWeek);
      const isRestDay = scheduledDay ? scheduledDay.isRestDay : true;
      const label = scheduledDay?.label ?? (isRestDay ? 'Rest' : 'Workout');
      const isWorkoutDay = !!scheduledDay && !scheduledDay.isRestDay;
      const completedSession = completedSessionMap.get(wDay.dateStr);
      const hasCompletedWorkout = !!completedSession;

      const status = deriveDayStatus({
        dateStr: wDay.dateStr,
        todayStr,
        isRestDay,
        hasCompletedWorkout,
        isWorkoutDay,
      });

      const exercises: CalendarExerciseItem[] =
        scheduledDay && !isRestDay
          ? scheduledDay.exercises.map((de) => ({
              id: de.id,
              name: de.exercise.name,
              category: de.exercise.category,
              displayOrder: de.displayOrder,
              defaultSets: de.defaultSets,
              defaultReps: de.defaultReps,
              defaultWeightKg: de.defaultWeightKg,
              notes: de.notes,
              primaryMuscle:
                de.exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
            }))
          : [];

      return {
        dateStr: wDay.dateStr,
        dayNumber: wDay.dayNumber,
        dayOfWeek: wDay.dayOfWeek,
        isCurrentMonth: true,
        isToday: wDay.dateStr === todayStr,
        status,
        label,
        isRestDay,
        exerciseCount: exercises.length,
        exercises,
        completedSessionId: completedSession?.id ?? null,
        finishedAt: completedSession?.finishedAt ? completedSession.finishedAt.toISOString() : null,
      };
    });

    return {
      startDate: weekDays[0]!.dateStr,
      endDate: weekDays[weekDays.length - 1]!.dateStr,
      todayStr,
      activeRoutine: activeRoutine
        ? {
            id: activeRoutine.id,
            name: activeRoutine.name,
          }
        : null,
      days,
    };
  }

  /**
   * Retrieves the planned workout and completion status for a specific date.
   */
  static async getDayWorkoutPlan(userId: string, dateStr: string, todayOverrideStr?: string) {
    const todayStr = todayOverrideStr || formatDateISO(new Date());
    const dateObj = createLocalDate(dateStr);
    const dayOfWeek = getDayOfWeekEnum(dateObj);

    const activeRoutine = await prisma.routine.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          where: { dayOfWeek },
          include: {
            exercises: {
              orderBy: { displayOrder: 'asc' },
              include: {
                exercise: {
                  include: {
                    muscles: {
                      include: {
                        muscleGroup: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const scheduledDay = activeRoutine?.days[0];
    const isRestDay = scheduledDay ? scheduledDay.isRestDay : true;
    const label = scheduledDay?.label ?? (isRestDay ? 'Rest Day' : 'Workout');
    const isWorkoutDay = !!scheduledDay && !scheduledDay.isRestDay;

    // Check for completed session on this day
    const dayStart = createLocalDate(dateStr);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    const status = deriveDayStatus({
      dateStr,
      todayStr,
      isRestDay,
      hasCompletedWorkout: !!session,
      isWorkoutDay,
    });

    const exercises: CalendarExerciseItem[] =
      scheduledDay && !isRestDay
        ? scheduledDay.exercises.map((de) => ({
            id: de.id,
            name: de.exercise.name,
            category: de.exercise.category,
            displayOrder: de.displayOrder,
            defaultSets: de.defaultSets,
            defaultReps: de.defaultReps,
            defaultWeightKg: de.defaultWeightKg,
            notes: de.notes,
            primaryMuscle:
              de.exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
          }))
        : [];

    return {
      dateStr,
      dayOfWeek,
      isToday: dateStr === todayStr,
      status,
      label,
      isRestDay,
      exerciseCount: exercises.length,
      exercises,
      routineName: activeRoutine?.name ?? null,
      completedSessionId: session?.id ?? null,
      finishedAt: session?.finishedAt?.toISOString() ?? null,
    };
  }
}
