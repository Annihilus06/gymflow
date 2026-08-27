'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Scale,
  Flame,
  Activity,
} from 'lucide-react';
import {
  formatDateISO,
  navigateMonth,
  CALENDAR_DAY_STATUS,
  type CalendarDayStatus,
} from '@/lib/utils/calendar';
import { BMISpectrumGauge } from '@/components/ui/visual/BMISpectrumGauge';
import type { MonthlyScheduleResponse } from '@/lib/services/calendar.service';
import type { UserProfileResponse } from '@/lib/services/profile.service';

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
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateISO(now));

  const [monthlyData, setMonthlyData] = useState<MonthlyScheduleResponse | null>(null);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [calRes, profRes] = await Promise.all([
        fetch(`/api/calendar/month?year=${year}&month=${month}`),
        fetch('/api/profile'),
      ]);

      if (calRes.ok) {
        const data: MonthlyScheduleResponse = await calRes.json();
        setMonthlyData(data);
      }

      if (profRes.ok) {
        const pData: UserProfileResponse = await profRes.json();
        setProfileData(pData);
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

  /**
   * Assign distinct color coding to different muscle groups:
   * Chest -> Red / Rose
   * Back / Lats -> Blue / Cyan
   * Legs / Quads / Hamstrings -> Amber / Orange
   * Shoulders / Arms -> Purple
   * Core / Full Body -> Emerald
   * Rest -> Slate
   */
  const getMuscleDayColor = (label?: string | null, isRest?: boolean) => {
    if (isRest) return 'border-border/40 bg-muted/20 text-muted-foreground';
    if (!label) return 'border-border/60 bg-card text-foreground';

    const lower = label.toLowerCase();
    if (lower.includes('chest') || lower.includes('push')) {
      return 'border-rose-500/40 bg-rose-500/10 text-rose-400 ring-rose-500/20';
    }
    if (lower.includes('back') || lower.includes('pull') || lower.includes('lat')) {
      return 'border-blue-500/40 bg-blue-500/10 text-blue-400 ring-blue-500/20';
    }
    if (lower.includes('leg') || lower.includes('quad') || lower.includes('hamstring') || lower.includes('glute')) {
      return 'border-amber-500/40 bg-amber-500/10 text-amber-400 ring-amber-500/20';
    }
    if (lower.includes('shoulder') || lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep')) {
      return 'border-purple-500/40 bg-purple-500/10 text-purple-400 ring-purple-500/20';
    }
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
  };

  const metrics = profileData?.metrics;
  const profile = profileData?.profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-primary" />
            Monthly Workout Calendar
          </h1>
          <p className="text-xs text-muted-foreground">
            Color-coded daily muscle splits, planned exercises, and biometrics.
          </p>
        </div>

        {/* Today Navigation */}
        <Button variant="outline" size="sm" onClick={handleGoToToday} className="text-xs font-bold h-9 gap-1.5 w-fit">
          <RotateCcw className="h-3.5 w-3.5" />
          Jump to Today
        </Button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Color Code Legend */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-card border border-border/70 text-[11px] font-bold">
        <span className="text-muted-foreground uppercase text-[10px] mr-1">Legend:</span>
        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
          ● Chest (Red)
        </span>
        <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/30">
          ● Back (Blue)
        </span>
        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
          ● Legs (Amber)
        </span>
        <span className="inline-flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30">
          ● Shoulders/Arms (Purple)
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/40">
          ● Rest (Gray)
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Monthly Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-border/80 bg-card shadow-sm">
            {/* Month & Year Navigation Header */}
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-foreground">
                  {MONTH_NAMES[currentMonth - 1]} {currentYear}
                </CardTitle>

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
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-muted-foreground pb-1">
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
                      const colorClass = getMuscleDayColor(day.label, isRest);

                      return (
                        <button
                          type="button"
                          key={day.dateStr}
                          onClick={() => setSelectedDateStr(day.dateStr)}
                          className={`flex flex-col justify-between p-1.5 sm:p-2 rounded-xl border text-left min-h-[72px] sm:min-h-[86px] transition-all relative ${
                            !day.isCurrentMonth
                              ? 'opacity-30 border-transparent bg-muted/10'
                              : isSelected
                              ? `${colorClass} ring-2 ring-primary shadow-md scale-[1.02]`
                              : isToday
                              ? `${colorClass} ring-2 ring-primary/60 shadow-sm`
                              : colorClass
                          }`}
                        >
                          {/* Day Number & Today indicator */}
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-xs font-black ${
                                isToday
                                  ? 'h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]'
                                  : 'text-foreground'
                              }`}
                            >
                              {day.dayNumber}
                            </span>

                            {isCompleted ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            ) : isRest ? (
                              <Moon className="h-3 w-3 text-muted-foreground/60" />
                            ) : null}
                          </div>

                          {/* Written Exercise / Muscle Label under date */}
                          <div className="mt-1 w-full">
                            {isRest ? (
                              <span className="text-[10px] text-muted-foreground font-semibold block truncate">
                                Rest
                              </span>
                            ) : (
                              <div>
                                <span className="text-[10px] font-black block truncate">
                                  {day.label ? day.label.replace(' - ', ' • ') : 'Workout'}
                                </span>
                                {day.exercises.length > 0 && (
                                  <span className="text-[9px] text-muted-foreground/90 font-medium block truncate">
                                    {day.exercises[0]?.name}
                                  </span>
                                )}
                              </div>
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

        {/* Right Sidebar: Selected Day & Biometrics (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Day Workout Details */}
          <Card className="border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Day Schedule
                </span>
                {selectedDayEvent?.isToday && (
                  <Badge variant="default" className="text-[9px] font-bold">
                    Today
                  </Badge>
                )}
              </div>

              <CardTitle className="text-base font-black pt-1">
                {selectedDayEvent?.dayOfWeek.charAt(0) +
                  (selectedDayEvent?.dayOfWeek.slice(1).toLowerCase() ?? '')}
                , {selectedDateStr}
              </CardTitle>

              <CardDescription className="text-xs font-semibold">
                {selectedDayEvent?.isRestDay
                  ? 'Scheduled Recovery Day'
                  : selectedDayEvent?.label || 'Planned Training Session'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-3 space-y-2.5 text-xs">
              {selectedDayEvent?.isRestDay ? (
                <div className="py-6 text-center space-y-1.5 text-muted-foreground">
                  <Moon className="h-7 w-7 mx-auto text-blue-400" />
                  <h4 className="text-xs font-bold text-foreground">Recovery & Muscle Repair</h4>
                </div>
              ) : selectedDayEvent?.exercises.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-3">
                  <Dumbbell className="h-5 w-5 mx-auto text-muted-foreground/60 mb-1" />
                  No exercises configured.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedDayEvent?.exercises.map((ex, i) => (
                    <div
                      key={ex.id}
                      className="p-2 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between"
                    >
                      <div className="truncate">
                        <span className="font-bold text-foreground text-xs block truncate">
                          {i + 1}. {ex.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {ex.defaultSets}×{ex.defaultReps}
                          {ex.defaultWeightKg ? ` @ ${ex.defaultWeightKg}kg` : ''}
                        </span>
                      </div>
                      {ex.primaryMuscle && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 text-primary border-primary/30">
                          {ex.primaryMuscle}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User BMI & Biometrics Card */}
          {metrics && (
            <Card className="border-border/80 bg-card p-4 space-y-3 shadow-sm rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                My Biometrics
              </h3>

              {/* BMI Gauge */}
              <BMISpectrumGauge bmi={metrics.bmi} category={metrics.bmiCategory} />

              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase">
                    <Scale className="h-3 w-3 text-blue-400" />
                    <span>Weight</span>
                  </div>
                  <span className="text-base font-black text-foreground mt-0.5 block">
                    {metrics.currentWeightKg} kg
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase">
                    <Flame className="h-3 w-3 text-orange-400 fill-current" />
                    <span>Target Cal</span>
                  </div>
                  <span className="text-base font-black text-foreground mt-0.5 block">
                    {metrics.dailyCalorieTarget} kcal
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
