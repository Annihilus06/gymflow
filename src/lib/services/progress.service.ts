import prisma from '@/lib/db/prisma';
import { calculateFrequencyPercentage, calculateStreak, calculateConsistencyScore } from '@/lib/utils/frequency';
import { formatVolume } from '@/lib/utils/volume';
import { getDayOfWeekEnum } from '@/lib/utils/calendar';

export interface MuscleGroupStat {
  name: string;
  sessionCount: number;
  volumeKg: number;
}

export interface ProgressSummary {
  period: 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  plannedWorkouts: number;
  completedWorkouts: number;
  missedWorkouts: number;
  frequencyPct: number;
  streak: number;
  consistencyScore: number;
  totalVolume: { value: number; unit: string; display: string };
  totalDurationSecs: number;
  muscleGroupBreakdown: MuscleGroupStat[];
}

export interface PersonalRecordItem {
  exerciseId: string;
  exerciseName: string;
  category: string;
  primaryMuscle: string | null;
  maxWeightKg: number;
  bestSetReps: number;
  achievedAt: Date;
}

export interface ExerciseProgressionPoint {
  date: string;
  sessionId: string;
  maxWeightKg: number;
  totalVolumeKg: number;
  setsCompleted: number;
  bestReps: number;
}

export class ProgressService {
  /**
   * Helper to format YYYY-MM-DD
   */
  private static formatYMD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Retrieves Weekly Analytics and Training Frequency.
   */
  static async getWeeklyProgress(userId: string, referenceDate = new Date()): Promise<ProgressSummary> {
    const ref = new Date(referenceDate);
    const dayOfWeek = ref.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (dayOfWeek + 6) % 7;

    const startOfWeek = new Date(ref);
    startOfWeek.setDate(ref.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 1. Fetch active routine to determine planned workout days in the week
    const activeRoutine = await prisma.routine.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          where: { isRestDay: false },
        },
      },
    });

    const plannedDaysCount = activeRoutine ? activeRoutine.days.length : 0;

    // 2. Fetch completed sessions within the week
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      include: {
        exerciseLogs: {
          include: {
            exercise: {
              include: {
                muscles: {
                  include: { muscleGroup: true },
                },
              },
            },
            sets: true,
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    // 3. Fetch all completed session dates for streak calculation
    const allCompletedSessions = await prisma.workoutSession.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { startedAt: true },
    });

    const completedDates = Array.from(
      new Set(allCompletedSessions.map((s) => this.formatYMD(s.startedAt)))
    );

    const completedWorkouts = sessions.length;
    const missedWorkouts = Math.max(0, plannedDaysCount - completedWorkouts);
    const frequencyPct = calculateFrequencyPercentage(completedWorkouts, plannedDaysCount);
    const streak = calculateStreak(completedDates, ref);
    const consistencyScore = calculateConsistencyScore(frequencyPct, streak);

    const totalVolumeKg = sessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);
    const totalDurationSecs = sessions.reduce((sum, s) => sum + (s.durationSecs || 0), 0);

    // 4. Muscle group breakdown
    const muscleMap = new Map<string, { sessionCount: number; volumeKg: number }>();
    for (const session of sessions) {
      const sessionMuscles = new Set<string>();
      for (const log of session.exerciseLogs) {
        const primary = log.exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name || 'Other';
        sessionMuscles.add(primary);
        const exVolume = log.sets.reduce((sum, set) => sum + set.actualReps * set.weightKg, 0);
        const curr = muscleMap.get(primary) || { sessionCount: 0, volumeKg: 0 };
        muscleMap.set(primary, {
          sessionCount: curr.sessionCount,
          volumeKg: curr.volumeKg + exVolume,
        });
      }
      for (const m of sessionMuscles) {
        const curr = muscleMap.get(m)!;
        curr.sessionCount += 1;
      }
    }

    const muscleGroupBreakdown: MuscleGroupStat[] = Array.from(muscleMap.entries()).map(
      ([name, stat]) => ({
        name,
        sessionCount: stat.sessionCount,
        volumeKg: Math.round(stat.volumeKg),
      })
    );

    return {
      period: 'week',
      startDate: this.formatYMD(startOfWeek),
      endDate: this.formatYMD(endOfWeek),
      plannedWorkouts: plannedDaysCount,
      completedWorkouts,
      missedWorkouts,
      frequencyPct,
      streak,
      consistencyScore,
      totalVolume: formatVolume(totalVolumeKg),
      totalDurationSecs,
      muscleGroupBreakdown,
    };
  }

  /**
   * Retrieves Monthly Analytics and Consistency.
   */
  static async getMonthlyProgress(userId: string, referenceDate = new Date()): Promise<ProgressSummary> {
    const ref = new Date(referenceDate);
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);

    // Count planned days across all days in month based on active routine
    const activeRoutine = await prisma.routine.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          where: { isRestDay: false },
        },
      },
    });

    const plannedDayEnums = new Set(activeRoutine?.days.map((d) => d.dayOfWeek) || []);

    let plannedCount = 0;
    const cur = new Date(startOfMonth);
    while (cur <= endOfMonth) {
      const dow = getDayOfWeekEnum(cur);
      if (plannedDayEnums.has(dow)) {
        plannedCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    const allCompletedSessions = await prisma.workoutSession.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { startedAt: true },
    });

    const completedDates = Array.from(
      new Set(allCompletedSessions.map((s) => this.formatYMD(s.startedAt)))
    );

    const completedWorkouts = sessions.length;
    const missedWorkouts = Math.max(0, plannedCount - completedWorkouts);
    const frequencyPct = calculateFrequencyPercentage(completedWorkouts, plannedCount);
    const streak = calculateStreak(completedDates, ref);
    const consistencyScore = calculateConsistencyScore(frequencyPct, streak);

    const totalVolumeKg = sessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);
    const totalDurationSecs = sessions.reduce((sum, s) => sum + (s.durationSecs || 0), 0);

    return {
      period: 'month',
      startDate: this.formatYMD(startOfMonth),
      endDate: this.formatYMD(endOfMonth),
      plannedWorkouts: plannedCount,
      completedWorkouts,
      missedWorkouts,
      frequencyPct,
      streak,
      consistencyScore,
      totalVolume: formatVolume(totalVolumeKg),
      totalDurationSecs,
      muscleGroupBreakdown: [],
    };
  }

  /**
   * Retrieves Yearly Summary broken down by month.
   */
  static async getYearlyProgress(userId: string, referenceDate = new Date()) {
    const year = referenceDate.getFullYear();
    const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthSessions = sessions.filter((s) => s.startedAt.getMonth() === i);
      const volumeKg = monthSessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);
      return {
        monthIndex: i,
        monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
        completedWorkouts: monthSessions.length,
        volumeKg: Math.round(volumeKg),
      };
    });

    const totalCompletedWorkouts = sessions.length;
    const totalVolumeKg = sessions.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);

    return {
      year,
      totalCompletedWorkouts,
      totalVolume: formatVolume(totalVolumeKg),
      months,
    };
  }

  /**
   * Discovers and retrieves Personal Records across all logged exercises.
   */
  static async getPersonalRecords(userId: string): Promise<PersonalRecordItem[]> {
    const sets = await prisma.setLog.findMany({
      where: {
        exerciseLog: {
          session: {
            userId,
            status: 'COMPLETED',
          },
        },
        weightKg: { gt: 0 },
      },
      include: {
        exerciseLog: {
          include: {
            exercise: {
              include: {
                muscles: {
                  include: { muscleGroup: true },
                },
              },
            },
          },
        },
      },
      orderBy: { weightKg: 'desc' },
    });

    const recordsMap = new Map<string, PersonalRecordItem>();

    for (const set of sets) {
      const ex = set.exerciseLog.exercise;
      if (!recordsMap.has(ex.id)) {
        recordsMap.set(ex.id, {
          exerciseId: ex.id,
          exerciseName: ex.name,
          category: ex.category,
          primaryMuscle: ex.muscles.find((m) => m.isPrimary)?.muscleGroup.name || null,
          maxWeightKg: set.weightKg,
          bestSetReps: set.actualReps,
          achievedAt: set.loggedAt,
        });
      }
    }

    return Array.from(recordsMap.values());
  }

  /**
   * Retrieves chronological exercise performance progression over time.
   */
  static async getExerciseProgression(
    userId: string,
    exerciseId: string
  ): Promise<ExerciseProgressionPoint[]> {
    const logs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId,
        session: {
          userId,
          status: 'COMPLETED',
        },
      },
      include: {
        session: { select: { id: true, startedAt: true } },
        sets: true,
      },
      orderBy: { session: { startedAt: 'asc' } },
    });

    return logs.map((log) => {
      const maxWeight = log.sets.reduce((max, s) => Math.max(max, s.weightKg), 0);
      const totalVolume = log.sets.reduce((sum, s) => sum + s.actualReps * s.weightKg, 0);
      const bestReps = log.sets.reduce((max, s) => Math.max(max, s.actualReps), 0);

      return {
        date: this.formatYMD(log.session.startedAt),
        sessionId: log.session.id,
        maxWeightKg: maxWeight,
        totalVolumeKg: Math.round(totalVolume),
        setsCompleted: log.sets.length,
        bestReps,
      };
    });
  }
}
