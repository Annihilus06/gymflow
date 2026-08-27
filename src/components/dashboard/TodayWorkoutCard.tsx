'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, PlusCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { CalendarDayEvent, CalendarExerciseItem } from '@/lib/services/calendar.service';

interface TodayWorkoutCardProps {
  todayDay?: CalendarDayEvent;
  hasActiveRoutine: boolean;
}

export function TodayWorkoutCard({ todayDay, hasActiveRoutine }: TodayWorkoutCardProps) {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const todayIso = new Date().toISOString().split('T')[0];

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    // Check if today was marked as completed
    const saved = localStorage.getItem(`workout-completed-${todayIso}`);
    if (saved === 'true' || todayDay?.status === 'COMPLETED') {
      setIsCompleted(true);
    }
  }, [todayIso, todayDay]);

  const handleToggleComplete = () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    localStorage.setItem(`workout-completed-${todayIso}`, String(nextState));
  };

  if (!hasActiveRoutine) {
    return (
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-extrabold text-primary border-primary/40 bg-primary/5" suppressHydrationWarning>
                ⚡ TODAY • {formattedToday}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground">
              Ready to Train?
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Start logging instantly or activate your weekly training split.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="default"
              onClick={handleToggleComplete}
              className={`gap-2 font-bold shadow-lg h-10 px-5 transition-all ${
                isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted ? 'Completed ✓' : 'Complete'}
            </Button>
            <Link href="/workout">
              <Button variant="outline" size="default" className="gap-2 font-semibold text-xs h-10">
                <PlusCircle className="h-4 w-4" />
                Choose Routine
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (todayDay?.isRestDay) {
    return (
      <Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-card via-card to-blue-500/10 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Moon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  RECOVERY DAY
                </Badge>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>{formattedToday}</span>
              </div>
              <h2 className="text-lg font-black text-foreground mt-0.5">Rest & Recharge</h2>
            </div>
          </div>

          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1 h-8">
              Schedule
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 shadow-md">
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow-sm transition-colors ${
                  isCompleted ? 'bg-emerald-600 text-white' : ''
                }`}
              >
                {isCompleted ? 'WORKOUT COMPLETED ✓' : "TODAY'S FOCUS"}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                {formattedToday}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {todayDay?.label || 'Scheduled Workout'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
              <span className="font-semibold text-primary">{todayDay?.exerciseCount || 0} exercises</span>
              <span>•</span>
              <span>~45 mins</span>
            </div>
          </div>

          {/* Complete Button */}
          <Button
            size="default"
            onClick={handleToggleComplete}
            className={`gap-2 font-black shadow-lg h-11 px-6 w-full sm:w-auto text-sm transition-all ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'
            }`}
            aria-label="Complete today's workout"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Completed ✓' : 'Completed'}
          </Button>
        </div>

        {/* Visual Exercise Mini-Grid */}
        {todayDay && Array.isArray(todayDay.exercises) && todayDay.exercises.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            {todayDay.exercises.slice(0, 4).map((ex: CalendarExerciseItem, i: number) => (
              <div
                key={ex.id}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card/80 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-xs text-foreground block truncate">
                      {ex.name}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {ex.defaultSets} sets × {ex.defaultReps} reps
                    </span>
                  </div>
                </div>

                {ex.primaryMuscle && (
                  <Badge variant="outline" className="text-[9px] font-semibold uppercase tracking-wider py-0.5 px-2 shrink-0 border-primary/30 text-primary bg-primary/5">
                    {ex.primaryMuscle}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clean Visual Action Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 border-t border-border/40 text-xs">
        <Link href="/workout" className="font-semibold text-muted-foreground hover:text-primary transition-colors">
          Edit Split
        </Link>
        <Link href="/calendar" className="flex items-center gap-1 font-semibold text-primary hover:underline">
          View Week
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
