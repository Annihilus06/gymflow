'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Moon,
  Dumbbell,
  AlertCircle,
  Loader2,
  CalendarDays,
  RotateCcw,
} from 'lucide-react';
import {
  formatDateISO,
  navigateMonth,
  CALENDAR_DAY_STATUS,
  type CalendarDayStatus,
} from '@/lib/utils/calendar';
import type { MonthlyScheduleResponse } from '@/lib/services/calendar.service';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateISO(now));

  const [monthlyData, setMonthlyData] = useState<MonthlyScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/calendar/month?year=${year}&month=${month}`);
      if (res.ok) {
        const data: MonthlyScheduleResponse = await res.json();
        setMonthlyData(data);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to load workout calendar.');
      }
    } catch {
      setErrorMessage('Failed to load workout calendar.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [fetchCalendar, currentYear, currentMonth]);

  const handlePrevMonth = () => {
    const { year, month } = navigateMonth(currentYear, currentMonth, -1);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleNextMonth = () => {
    const { year, month } = navigateMonth(currentYear, currentMonth, 1);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDateStr(formatDateISO(today));
  };

  // Locate the currently selected day event from loaded grid
  const selectedDayEvent = monthlyData?.grid.find((d) => d.dateStr === selectedDateStr);

  const getStatusBadge = (status: CalendarDayStatus) => {
    switch (status) {
      case CALENDAR_DAY_STATUS.COMPLETED:
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case CALENDAR_DAY_STATUS.TODAY:
        return (
          <Badge variant="default" className="bg-primary text-primary-foreground text-[10px]">
            Today
          </Badge>
        );
      case CALENDAR_DAY_STATUS.REST:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Moon className="h-3 w-3 text-muted-foreground" />
            Rest Day
          </Badge>
        );
      case CALENDAR_DAY_STATUS.MISSED:
        return (
          <Badge variant="destructive" className="text-[10px]">
            Missed
          </Badge>
        );
      case CALENDAR_DAY_STATUS.UPCOMING:
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            Upcoming
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workout Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Track planned training sessions, completed workouts, and recovery days.
          </p>
        </div>

        {/* View Mode & Today Action */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoToToday} className="text-xs h-8 gap-1">
            <RotateCcw className="h-3 w-3" />
            Today
          </Button>

          <div className="flex rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'MONTH'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEK')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'WEEK'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Routine Banner Notice */}
      {!monthlyData?.activeRoutine && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-semibold text-sm text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                No Active Workout Routine
              </div>
              <p className="text-xs text-muted-foreground">
                Set up an active weekly split to schedule your workout days and muscle groups.
              </p>
            </div>
            <Link href="/workout">
              <Button size="sm" variant="outline" className="text-xs shrink-0">
                Configure Split
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Calendar View (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card shadow-sm">
            {/* Month & Year Navigation Header */}
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">
                    {MONTH_NAMES[currentMonth - 1]} {currentYear}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 p-0"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4">
              {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 7-Day Column Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-muted-foreground pb-1">
                    {WEEKDAY_HEADERS.map((h) => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>

                  {/* Calendar Grid Days */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {monthlyData?.grid.map((day) => {
                      const isSelected = day.dateStr === selectedDateStr;
                      const isCompleted = day.status === CALENDAR_DAY_STATUS.COMPLETED;
                      const isToday = day.isToday;
                      const isRest = day.isRestDay;
                      const isMissed = day.status === CALENDAR_DAY_STATUS.MISSED;

                      return (
                        <button
                          type="button"
                          key={day.dateStr}
                          onClick={() => setSelectedDateStr(day.dateStr)}
                          className={`flex flex-col justify-between p-1.5 sm:p-2 rounded-lg border text-left min-h-[64px] sm:min-h-[78px] transition-all relative ${
                            !day.isCurrentMonth
                              ? 'opacity-40 border-transparent bg-muted/10'
                              : isSelected
                                ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-sm'
                                : isToday
                                  ? 'border-primary/60 bg-primary/5'
                                  : isCompleted
                                    ? 'border-emerald-500/40 bg-emerald-500/5'
                                    : isMissed
                                      ? 'border-destructive/30 bg-destructive/5'
                                      : isRest
                                        ? 'border-border/40 bg-muted/30'
                                        : 'border-border/80 bg-card hover:border-border'
                          }`}
                        >
                          {/* Day Number & Status Icon */}
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-xs font-bold ${
                                isToday
                                  ? 'h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px]'
                                  : 'text-foreground'
                              }`}
                            >
                              {day.dayNumber}
                            </span>

                            {isCompleted ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            ) : isRest ? (
                              <Moon className="h-3 w-3 text-muted-foreground/60" />
                            ) : null}
                          </div>

                          {/* Muscle Group / Split Label */}
                          <div className="mt-1 w-full">
                            {isRest ? (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                Rest
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-foreground/80 block truncate">
                                {day.label || 'Workout'}
                              </span>
                            )}

                            {!isRest && day.exerciseCount > 0 && (
                              <span className="text-[9px] text-muted-foreground hidden sm:block">
                                {day.exerciseCount} ex
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Workout Plan Panel */}
        <div className="space-y-4">
          <Card className="border-border bg-card shadow-sm sticky top-20">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>Day Schedule</span>
                </div>
                {selectedDayEvent && getStatusBadge(selectedDayEvent.status)}
              </div>

              <CardTitle className="text-lg font-bold pt-1">
                {selectedDayEvent?.dayOfWeek.charAt(0) +
                  (selectedDayEvent?.dayOfWeek.slice(1).toLowerCase() ?? '')}
                , {selectedDateStr}
              </CardTitle>

              <CardDescription className="text-xs">
                {selectedDayEvent?.isRestDay
                  ? 'Scheduled Recovery Day'
                  : selectedDayEvent?.label || 'Planned Workout Session'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {selectedDayEvent?.isRestDay ? (
                <div className="py-8 text-center space-y-2 text-muted-foreground">
                  <Moon className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <h4 className="text-sm font-semibold text-foreground">Rest & Regeneration</h4>
                  <p className="text-xs">
                    Take time to rest, hydrate, and allow muscle fibers to recover.
                  </p>
                </div>
              ) : selectedDayEvent?.exercises.length === 0 ? (
                <div className="py-8 text-center space-y-2 text-muted-foreground border border-dashed border-border rounded-lg p-4">
                  <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground/60" />
                  <p className="text-xs">No specific exercises configured for this day.</p>
                  <Link href="/workout">
                    <Button variant="outline" size="sm" className="text-xs">
                      Edit Routine Split
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Planned Exercises ({selectedDayEvent?.exercises.length ?? 0})
                  </div>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 divide-y divide-border/40">
                    {selectedDayEvent?.exercises.map((ex, i) => (
                      <div key={ex.id} className="pt-2 first:pt-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {i + 1}. {ex.name}
                          </span>
                          {ex.primaryMuscle && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              {ex.primaryMuscle}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {ex.defaultSets} sets × {ex.defaultReps} reps
                          {ex.defaultWeightKg ? ` @ ${ex.defaultWeightKg} kg` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 pt-3 pb-3 flex justify-between">
              <Link href="/workout" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Manage Workout Routine
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
