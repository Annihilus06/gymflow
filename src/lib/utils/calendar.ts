import type { DayOfWeek } from '@/types/database';

export const CALENDAR_DAY_STATUS = {
  TODAY: 'TODAY',
  COMPLETED: 'COMPLETED',
  UPCOMING: 'UPCOMING',
  MISSED: 'MISSED',
  REST: 'REST',
} as const;

export type CalendarDayStatus =
  (typeof CALENDAR_DAY_STATUS)[keyof typeof CALENDAR_DAY_STATUS];

export const DAYS_OF_WEEK_ORDERED: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

/**
 * Formats a Date object as a standard YYYY-MM-DD string using local calendar parts.
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into year, month (1-12), and day components without timezone drift.
 */
export function parseDateISO(isoDate: string): { year: number; month: number; day: number } {
  if (!isoDate || typeof isoDate !== 'string') {
    return { year: 2026, month: 1, day: 1 };
  }
  const parts = isoDate.split('-');
  const year = parseInt(parts[0] ?? '', 10);
  const month = parseInt(parts[1] ?? '', 10);
  const day = parseInt(parts[2] ?? '', 10);
  return {
    year: isNaN(year) ? 2026 : year,
    month: isNaN(month) ? 1 : month,
    day: isNaN(day) ? 1 : day,
  };
}

/**
 * Creates a local Date object from YYYY-MM-DD at 00:00:00 local time.
 */
export function createLocalDate(isoDate: string): Date {
  const { year, month, day } = parseDateISO(isoDate);
  return new Date(year, month - 1, day);
}

/**
 * Returns the Prisma DayOfWeek enum for a given Date.
 */
export function getDayOfWeekEnum(date: Date): DayOfWeek {
  const jsDay = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const map: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return map[jsDay] ?? 'MONDAY';
}

/**
 * Checks if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the number of days in a given month (1-indexed month: 1 = Jan, 12 = Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    return 30;
  }
  const daysPerMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysPerMonth[month - 1] ?? 30;
}

/**
 * Handles month navigation across year boundaries.
 *
 * @param year - Current year (e.g. 2026)
 * @param month - Current month (1-12)
 * @param delta - Change in months (+1 or -1)
 */
export function navigateMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  let newMonth = month + delta;
  let newYear = year;

  while (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }
  while (newMonth < 1) {
    newMonth += 12;
    newYear -= 1;
  }

  return { year: newYear, month: newMonth };
}

/**
 * Derives the calendar day status based on workout execution, scheduled rest, and date position.
 */
export function deriveDayStatus(params: {
  dateStr: string;
  todayStr: string;
  isRestDay: boolean;
  hasCompletedWorkout: boolean;
  isWorkoutDay: boolean;
}): CalendarDayStatus {
  const { dateStr, todayStr, isRestDay, hasCompletedWorkout, isWorkoutDay } = params;

  if (hasCompletedWorkout) {
    return CALENDAR_DAY_STATUS.COMPLETED;
  }

  if (dateStr === todayStr) {
    return CALENDAR_DAY_STATUS.TODAY;
  }

  if (isRestDay) {
    return CALENDAR_DAY_STATUS.REST;
  }

  if (dateStr < todayStr && isWorkoutDay) {
    return CALENDAR_DAY_STATUS.MISSED;
  }

  return CALENDAR_DAY_STATUS.UPCOMING;
}

export interface MonthGridDay {
  dateStr: string;
  dayNumber: number;
  dayOfWeek: DayOfWeek;
  isCurrentMonth: boolean;
}

/**
 * Generates the full 7-column calendar matrix for a given month, starting on Monday.
 * Includes padding days from previous and next months.
 */
export function getMonthGrid(year: number, month: number): MonthGridDay[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const firstDayJs = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  // Monday-based index: 0 = Mon, 1 = Tue, ..., 6 = Sun
  const startingDayIndex = (firstDayJs + 6) % 7;

  const grid: MonthGridDay[] = [];

  // Previous month padding
  if (startingDayIndex > 0) {
    const prev = navigateMonth(year, month, -1);
    const prevDaysCount = getDaysInMonth(prev.year, prev.month);
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const dayNum = prevDaysCount - i;
      const d = new Date(prev.year, prev.month - 1, dayNum);
      grid.push({
        dateStr: formatDateISO(d),
        dayNumber: dayNum,
        dayOfWeek: getDayOfWeekEnum(d),
        isCurrentMonth: false,
      });
    }
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = new Date(year, month - 1, dayNum);
    grid.push({
      dateStr: formatDateISO(d),
      dayNumber: dayNum,
      dayOfWeek: getDayOfWeekEnum(d),
      isCurrentMonth: true,
    });
  }

  // Next month padding to complete 7-day rows (multiples of 7)
  const remaining = (7 - (grid.length % 7)) % 7;
  if (remaining > 0) {
    const next = navigateMonth(year, month, 1);
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(next.year, next.month - 1, dayNum);
      grid.push({
        dateStr: formatDateISO(d),
        dayNumber: dayNum,
        dayOfWeek: getDayOfWeekEnum(d),
        isCurrentMonth: false,
      });
    }
  }

  return grid;
}

/**
 * Returns the 7 days of the week containing referenceDate (Monday through Sunday).
 */
export function getWeekDays(referenceDate: Date = new Date()): {
  dateStr: string;
  dayNumber: number;
  dayOfWeek: DayOfWeek;
  date: Date;
}[] {
  const d = new Date(referenceDate);
  const dayIndex = (d.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayIndex);

  const days: { dateStr: string; dayNumber: number; dayOfWeek: DayOfWeek; date: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    days.push({
      dateStr: formatDateISO(current),
      dayNumber: current.getDate(),
      dayOfWeek: getDayOfWeekEnum(current),
      date: current,
    });
  }

  return days;
}
