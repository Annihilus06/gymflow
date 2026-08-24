import { describe, it, expect } from 'vitest';
import {
  formatDateISO,
  parseDateISO,
  createLocalDate,
  getDayOfWeekEnum,
  isLeapYear,
  getDaysInMonth,
  navigateMonth,
  deriveDayStatus,
  getMonthGrid,
  getWeekDays,
  CALENDAR_DAY_STATUS,
} from '@/lib/utils/calendar';

describe('Calendar Utilities', () => {
  describe('formatDateISO & parseDateISO', () => {
    it('formats date correctly as YYYY-MM-DD', () => {
      const d = new Date(2026, 7, 24); // Month index 7 is August
      expect(formatDateISO(d)).toBe('2026-08-24');
    });

    it('parses YYYY-MM-DD string into date parts', () => {
      const parsed = parseDateISO('2026-08-24');
      expect(parsed).toEqual({ year: 2026, month: 8, day: 24 });
    });

    it('handles fallback defaults when parsing malformed strings', () => {
      const parsed = parseDateISO('');
      expect(parsed.year).toBe(2026);
      expect(parsed.month).toBe(1);
      expect(parsed.day).toBe(1);
    });

    it('creates local Date object accurately without timezone rollback', () => {
      const local = createLocalDate('2026-12-25');
      expect(local.getFullYear()).toBe(2026);
      expect(local.getMonth()).toBe(11); // December
      expect(local.getDate()).toBe(25);
    });
  });

  describe('getDayOfWeekEnum', () => {
    it('identifies Sunday correctly', () => {
      const sunday = new Date(2026, 7, 23); // Aug 23, 2026 is Sunday
      expect(getDayOfWeekEnum(sunday)).toBe('SUNDAY');
    });

    it('identifies Monday correctly', () => {
      const monday = new Date(2026, 7, 24); // Aug 24, 2026 is Monday
      expect(getDayOfWeekEnum(monday)).toBe('MONDAY');
    });

    it('identifies Wednesday correctly', () => {
      const wednesday = new Date(2026, 7, 26); // Aug 26, 2026 is Wednesday
      expect(getDayOfWeekEnum(wednesday)).toBe('WEDNESDAY');
    });

    it('identifies Saturday correctly', () => {
      const saturday = new Date(2026, 7, 29); // Aug 29, 2026 is Saturday
      expect(getDayOfWeekEnum(saturday)).toBe('SATURDAY');
    });
  });

  describe('isLeapYear & getDaysInMonth', () => {
    it('accurately identifies leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });

    it('calculates 29 days for Feb in leap year and 28 in non-leap year', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2026, 2)).toBe(28);
    });

    it('calculates correct days for standard months', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31); // Jan
      expect(getDaysInMonth(2026, 4)).toBe(30); // Apr
      expect(getDaysInMonth(2026, 8)).toBe(31); // Aug
      expect(getDaysInMonth(2026, 9)).toBe(30); // Sep
    });

    it('handles out-of-range month numbers by returning default 30', () => {
      expect(getDaysInMonth(2026, 0)).toBe(30);
      expect(getDaysInMonth(2026, 13)).toBe(30);
    });
  });

  describe('navigateMonth', () => {
    it('moves forward and backward within same year', () => {
      expect(navigateMonth(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
      expect(navigateMonth(2026, 5, -1)).toEqual({ year: 2026, month: 4 });
    });

    it('crosses forward into next year when advancing past December', () => {
      expect(navigateMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    });

    it('crosses backward into previous year when decrementing past January', () => {
      expect(navigateMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    });
  });

  describe('deriveDayStatus', () => {
    const todayStr = '2026-08-24';

    it('returns COMPLETED if user has completed a workout on that day', () => {
      const status = deriveDayStatus({
        dateStr: '2026-08-20',
        todayStr,
        isRestDay: false,
        hasCompletedWorkout: true,
        isWorkoutDay: true,
      });
      expect(status).toBe(CALENDAR_DAY_STATUS.COMPLETED);
    });

    it('returns TODAY if the date matches today without completed session', () => {
      const status = deriveDayStatus({
        dateStr: todayStr,
        todayStr,
        isRestDay: false,
        hasCompletedWorkout: false,
        isWorkoutDay: true,
      });
      expect(status).toBe(CALENDAR_DAY_STATUS.TODAY);
    });

    it('returns REST if the day is scheduled as rest', () => {
      const status = deriveDayStatus({
        dateStr: '2026-08-26',
        todayStr,
        isRestDay: true,
        hasCompletedWorkout: false,
        isWorkoutDay: false,
      });
      expect(status).toBe(CALENDAR_DAY_STATUS.REST);
    });

    it('returns MISSED if a past scheduled workout was not completed', () => {
      const status = deriveDayStatus({
        dateStr: '2026-08-20',
        todayStr,
        isRestDay: false,
        hasCompletedWorkout: false,
        isWorkoutDay: true,
      });
      expect(status).toBe(CALENDAR_DAY_STATUS.MISSED);
    });

    it('returns UPCOMING for future workout days', () => {
      const status = deriveDayStatus({
        dateStr: '2026-08-28',
        todayStr,
        isRestDay: false,
        hasCompletedWorkout: false,
        isWorkoutDay: true,
      });
      expect(status).toBe(CALENDAR_DAY_STATUS.UPCOMING);
    });
  });

  describe('getMonthGrid', () => {
    it('generates a grid whose length is a multiple of 7 (complete weeks)', () => {
      const grid = getMonthGrid(2026, 8); // August 2026
      expect(grid.length % 7).toBe(0);
      expect(grid.length).toBeGreaterThanOrEqual(28);

      // August 2026 starts on Saturday (idx 5 in Mon-based week), so leading padding exists
      const aug1 = grid.find((d) => d.dateStr === '2026-08-01');
      expect(aug1).toBeDefined();
      expect(aug1?.isCurrentMonth).toBe(true);
      expect(aug1?.dayOfWeek).toBe('SATURDAY');
    });

    it('marks isCurrentMonth appropriately for padding and active days', () => {
      const grid = getMonthGrid(2026, 8);
      const prevPad = grid[0];
      expect(prevPad?.isCurrentMonth).toBe(false);

      const midDay = grid.find((d) => d.dayNumber === 15 && d.isCurrentMonth);
      expect(midDay).toBeDefined();
      expect(midDay?.isCurrentMonth).toBe(true);
    });
  });

  describe('getWeekDays', () => {
    it('returns exactly 7 days starting with Monday and ending with Sunday', () => {
      const ref = new Date(2026, 7, 24); // Monday Aug 24
      const week = getWeekDays(ref);
      expect(week).toHaveLength(7);
      expect(week[0]?.dayOfWeek).toBe('MONDAY');
      expect(week[6]?.dayOfWeek).toBe('SUNDAY');
      expect(week[0]?.dateStr).toBe('2026-08-24');
      expect(week[6]?.dateStr).toBe('2026-08-30');
    });
  });
});
