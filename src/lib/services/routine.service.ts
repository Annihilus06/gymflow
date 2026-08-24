import prisma from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import type { DayOfWeek } from '@/types/database';
import type {
  CreateRoutineInput,
  UpdateRoutineInput,
  UpdateRoutineDayInput,
  AddExerciseToDayInput,
  UpdateRoutineExerciseInput,
} from '@/lib/validations/routine.schema';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DEFAULT_SPLIT_LABELS: Record<DayOfWeek, { label: string; isRest: boolean }> = {
  MONDAY: { label: 'Chest & Triceps', isRest: false },
  TUESDAY: { label: 'Back & Biceps', isRest: false },
  WEDNESDAY: { label: 'Rest & Recovery', isRest: true },
  THURSDAY: { label: 'Shoulders & Abs', isRest: false },
  FRIDAY: { label: 'Legs & Calves', isRest: false },
  SATURDAY: { label: 'Arms & Core', isRest: false },
  SUNDAY: { label: 'Rest & Recovery', isRest: true },
};

export class RoutineService {
  /**
   * Lists all routines for the authenticated user.
   */
  static async getUserRoutines(userId: string) {
    const routines = await prisma.routine.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      include: {
        days: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              include: {
                exercise: true,
              },
            },
          },
        },
      },
    });

    return routines.map((r) => {
      // Sort days in standard Monday -> Sunday order
      const sortedDays = [...r.days].sort(
        (a, b) => DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek)
      );

      const totalExercises = sortedDays.reduce((acc, d) => acc + d.exercises.length, 0);
      const restDaysCount = sortedDays.filter((d) => d.isRestDay).length;
      const workoutDaysCount = 7 - restDaysCount;

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        workoutDaysCount,
        restDaysCount,
        totalExercises,
        days: sortedDays.map((d) => ({
          id: d.id,
          dayOfWeek: d.dayOfWeek,
          label: d.label,
          isRestDay: d.isRestDay,
          exerciseCount: d.exercises.length,
          muscleGroup: d.label,
        })),
      };
    });
  }

  /**
   * Retrieves a single routine with all days and exercises.
   */
  static async getRoutineById(userId: string, routineId: string) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
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

    if (!routine) {
      throw AppError.notFound('Routine not found.');
    }

    const sortedDays = [...routine.days].sort(
      (a, b) => DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek)
    );

    return {
      id: routine.id,
      name: routine.name,
      description: routine.description,
      isActive: routine.isActive,
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
      days: sortedDays.map((day) => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        label: day.label,
        isRestDay: day.isRestDay,
        exercises: day.exercises.map((de) => ({
          id: de.id,
          exerciseId: de.exerciseId,
          name: de.exercise.name,
          category: de.exercise.category,
          displayOrder: de.displayOrder,
          defaultSets: de.defaultSets,
          defaultReps: de.defaultReps,
          defaultWeightKg: de.defaultWeightKg,
          notes: de.notes,
          primaryMuscle:
            de.exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
        })),
      })),
    };
  }

  /**
   * Creates a new routine with full 7-day weekly schedule.
   */
  static async createRoutine(userId: string, input: CreateRoutineInput) {
    const existingCount = await prisma.routine.count({ where: { userId } });
    const shouldBeActive = input.isActive || existingCount === 0;

    return prisma.$transaction(async (tx) => {
      if (shouldBeActive) {
        await tx.routine.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });
      }

      const routine = await tx.routine.create({
        data: {
          userId,
          name: input.name,
          description: input.description,
          isActive: shouldBeActive,
        },
      });

      // Prepare 7 days
      for (const day of DAYS_OF_WEEK) {
        const inputDay = input.days?.find((d) => d.dayOfWeek === day);
        const label = inputDay?.label ?? DEFAULT_SPLIT_LABELS[day].label;
        const isRestDay = inputDay?.isRestDay ?? DEFAULT_SPLIT_LABELS[day].isRest;

        const createdDay = await tx.routineDay.create({
          data: {
            routineId: routine.id,
            dayOfWeek: day,
            label,
            isRestDay,
          },
        });

        // Add exercises if passed
        if (inputDay?.exercises && inputDay.exercises.length > 0 && !isRestDay) {
          for (let i = 0; i < inputDay.exercises.length; i++) {
            const ex = inputDay.exercises[i];
            if (!ex) continue;
            await tx.routineDayExercise.create({
              data: {
                routineDayId: createdDay.id,
                exerciseId: ex.exerciseId,
                displayOrder: ex.displayOrder ?? i,
                defaultSets: ex.defaultSets ?? 3,
                defaultReps: ex.defaultReps ?? 10,
                defaultWeightKg: ex.defaultWeightKg,
                notes: ex.notes,
              },
            });
          }
        }
      }

      return routine;
    }).then((created) => this.getRoutineById(userId, created.id));
  }

  /**
   * Updates routine name, description, or active status.
   */
  static async updateRoutine(userId: string, routineId: string, input: UpdateRoutineInput) {
    const existing = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!existing) {
      throw AppError.notFound('Routine not found.');
    }

    return prisma.$transaction(async (tx) => {
      if (input.isActive === true) {
        await tx.routine.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });
      }

      const updated = await tx.routine.update({
        where: { id: routineId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      return updated;
    }).then(() => this.getRoutineById(userId, routineId));
  }

  /**
   * Deletes a routine and its days/exercises.
   */
  static async deleteRoutine(userId: string, routineId: string) {
    const existing = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!existing) {
      throw AppError.notFound('Routine not found.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.routine.delete({
        where: { id: routineId },
      });

      // If this was the active routine, activate another one if available
      if (existing.isActive) {
        const nextRoutine = await tx.routine.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });

        if (nextRoutine) {
          await tx.routine.update({
            where: { id: nextRoutine.id },
            data: { isActive: true },
          });
        }
      }
    });

    return { success: true, message: 'Routine deleted successfully.' };
  }

  /**
   * Sets a routine as the active weekly routine.
   */
  static async activateRoutine(userId: string, routineId: string) {
    const existing = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!existing) {
      throw AppError.notFound('Routine not found.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.routine.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      await tx.routine.update({
        where: { id: routineId },
        data: { isActive: true },
      });
    });

    return this.getRoutineById(userId, routineId);
  }

  /**
   * Duplicates an existing routine with all its days, muscle groups, and exercises.
   */
  static async duplicateRoutine(userId: string, routineId: string, newName?: string) {
    const original = await this.getRoutineById(userId, routineId);

    const duplicateName = newName?.trim() || `${original.name} (Copy)`;

    return prisma.$transaction(async (tx) => {
      const clonedRoutine = await tx.routine.create({
        data: {
          userId,
          name: duplicateName,
          description: original.description,
          isActive: false,
        },
      });

      for (const day of original.days) {
        const clonedDay = await tx.routineDay.create({
          data: {
            routineId: clonedRoutine.id,
            dayOfWeek: day.dayOfWeek,
            label: day.label,
            isRestDay: day.isRestDay,
          },
        });

        for (const ex of day.exercises) {
          await tx.routineDayExercise.create({
            data: {
              routineDayId: clonedDay.id,
              exerciseId: ex.exerciseId,
              displayOrder: ex.displayOrder,
              defaultSets: ex.defaultSets,
              defaultReps: ex.defaultReps,
              defaultWeightKg: ex.defaultWeightKg,
              notes: ex.notes,
            },
          });
        }
      }

      return clonedRoutine;
    }).then((cloned) => this.getRoutineById(userId, cloned.id));
  }

  /**
   * Updates a specific routine day (muscle group label or rest day status).
   */
  static async updateRoutineDay(
    userId: string,
    routineId: string,
    dayId: string,
    input: UpdateRoutineDayInput
  ) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
      select: { id: true },
    });

    if (!routine) {
      throw AppError.notFound('Routine not found.');
    }

    const day = await prisma.routineDay.findFirst({
      where: { id: dayId, routineId },
    });

    if (!day) {
      throw AppError.notFound('Routine day not found.');
    }

    const updated = await prisma.routineDay.update({
      where: { id: dayId },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.isRestDay !== undefined ? { isRestDay: input.isRestDay } : {}),
      },
    });

    return updated;
  }

  /**
   * Adds an exercise to a routine day.
   */
  static async addExerciseToDay(
    userId: string,
    routineId: string,
    dayId: string,
    input: AddExerciseToDayInput
  ) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!routine) {
      throw AppError.notFound('Routine not found.');
    }

    const day = await prisma.routineDay.findFirst({
      where: { id: dayId, routineId },
      include: {
        exercises: {
          orderBy: { displayOrder: 'desc' },
          take: 1,
        },
      },
    });

    if (!day) {
      throw AppError.notFound('Routine day not found.');
    }

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: input.exerciseId },
    });

    if (!exercise) {
      throw AppError.notFound('Exercise not found.');
    }

    const nextOrder =
      input.displayOrder ??
      (day.exercises.length > 0 ? (day.exercises[0]?.displayOrder ?? 0) + 1 : 0);

    const created = await prisma.routineDayExercise.create({
      data: {
        routineDayId: dayId,
        exerciseId: input.exerciseId,
        displayOrder: nextOrder,
        defaultSets: input.defaultSets ?? 3,
        defaultReps: input.defaultReps ?? 10,
        defaultWeightKg: input.defaultWeightKg,
        notes: input.notes,
      },
      include: {
        exercise: true,
      },
    });

    // If day was marked as rest, unmark it
    if (day.isRestDay) {
      await prisma.routineDay.update({
        where: { id: dayId },
        data: { isRestDay: false },
      });
    }

    return created;
  }

  /**
   * Updates exercise settings (sets, reps, weight, notes) for a routine day exercise.
   */
  static async updateRoutineExercise(
    userId: string,
    routineId: string,
    dayId: string,
    routineExerciseId: string,
    input: UpdateRoutineExerciseInput
  ) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!routine) {
      throw AppError.notFound('Routine not found.');
    }

    const exercise = await prisma.routineDayExercise.findFirst({
      where: { id: routineExerciseId, routineDayId: dayId },
    });

    if (!exercise) {
      throw AppError.notFound('Routine exercise not found.');
    }

    const updated = await prisma.routineDayExercise.update({
      where: { id: routineExerciseId },
      data: {
        ...(input.defaultSets !== undefined ? { defaultSets: input.defaultSets } : {}),
        ...(input.defaultReps !== undefined ? { defaultReps: input.defaultReps } : {}),
        ...(input.defaultWeightKg !== undefined ? { defaultWeightKg: input.defaultWeightKg } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      },
      include: {
        exercise: true,
      },
    });

    return updated;
  }

  /**
   * Removes an exercise from a routine day and compacts order numbers.
   */
  static async removeExerciseFromDay(
    userId: string,
    routineId: string,
    dayId: string,
    routineExerciseId: string
  ) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!routine) {
      throw AppError.notFound('Routine not found.');
    }

    const exercise = await prisma.routineDayExercise.findFirst({
      where: { id: routineExerciseId, routineDayId: dayId },
    });

    if (!exercise) {
      throw AppError.notFound('Routine exercise not found.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.routineDayExercise.delete({
        where: { id: routineExerciseId },
      });

      // Compact remaining exercises
      const remaining = await tx.routineDayExercise.findMany({
        where: { routineDayId: dayId },
        orderBy: { displayOrder: 'asc' },
      });

      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];
        if (!item) continue;
        if (item.displayOrder !== i) {
          await tx.routineDayExercise.update({
            where: { id: item.id },
            data: { displayOrder: i },
          });
        }
      }
    });

    return { success: true, message: 'Exercise removed from routine day.' };
  }

  /**
   * Reorders exercises within a routine day.
   */
  static async reorderExercises(
    userId: string,
    routineId: string,
    dayId: string,
    exerciseIds: string[]
  ) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });

    if (!routine) {
      throw AppError.notFound('Routine not found.');
    }

    const existingExercises = await prisma.routineDayExercise.findMany({
      where: { routineDayId: dayId },
    });

    const existingIds = new Set(existingExercises.map((e) => e.id));

    // Verify all IDs belong to this day
    for (const id of exerciseIds) {
      if (!existingIds.has(id)) {
        throw AppError.badRequest(`Exercise ID ${id} does not belong to this routine day.`);
      }
    }

    await prisma.$transaction(async (tx) => {
      // Step 1: Temporarily shift display orders to high offsets to prevent unique constraint conflicts
      for (let i = 0; i < exerciseIds.length; i++) {
        const id = exerciseIds[i];
        if (!id) continue;
        await tx.routineDayExercise.update({
          where: { id },
          data: { displayOrder: 1000 + i },
        });
      }

      // Step 2: Set final zero-based display orders
      for (let i = 0; i < exerciseIds.length; i++) {
        const id = exerciseIds[i];
        if (!id) continue;
        await tx.routineDayExercise.update({
          where: { id },
          data: { displayOrder: i },
        });
      }
    });

    return this.getRoutineById(userId, routineId);
  }

  /**
   * Retrieves today's scheduled workout from the user's active routine.
   */
  static async getTodayWorkout(userId: string) {
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

    if (!activeRoutine) {
      return null;
    }

    // Map JS Sunday(0)-Saturday(6) to DayOfWeek enum
    const jsDay = new Date().getDay();
    const dayMap: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const todayEnum = dayMap[jsDay] ?? 'MONDAY';

    const todayDay = activeRoutine.days.find((d) => d.dayOfWeek === todayEnum);

    if (!todayDay) {
      return null;
    }

    return {
      routineId: activeRoutine.id,
      routineName: activeRoutine.name,
      dayId: todayDay.id,
      dayOfWeek: todayDay.dayOfWeek,
      label: todayDay.label,
      isRestDay: todayDay.isRestDay,
      exercises: todayDay.exercises.map((de) => ({
        id: de.id,
        exerciseId: de.exerciseId,
        name: de.exercise.name,
        category: de.exercise.category,
        displayOrder: de.displayOrder,
        defaultSets: de.defaultSets,
        defaultReps: de.defaultReps,
        defaultWeightKg: de.defaultWeightKg,
        notes: de.notes,
        primaryMuscle:
          de.exercise.muscles.find((m) => m.isPrimary)?.muscleGroup.name ?? null,
      })),
    };
  }
}
