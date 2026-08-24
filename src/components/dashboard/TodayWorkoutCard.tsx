'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Moon, PlusCircle, Play, ChevronRight } from 'lucide-react';
import type { CalendarDayEvent, CalendarExerciseItem } from '@/lib/services/calendar.service';

interface TodayWorkoutCardProps {
  todayDay?: CalendarDayEvent;
  hasActiveRoutine: boolean;
}

export function TodayWorkoutCard({ todayDay, hasActiveRoutine }: TodayWorkoutCardProps) {
  if (!hasActiveRoutine) {
    return (
      <Card className="border-dashed border-primary/40 bg-card/60 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <Dumbbell className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg font-bold text-foreground">No Routine Configured Yet</CardTitle>
        <CardDescription className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
          Create your personalized weekly training routine to schedule workouts and unlock calendar tracking.
        </CardDescription>
        <Link href="/workout">
          <Button size="sm" className="gap-1.5 font-semibold text-xs h-9">
            <PlusCircle className="h-4 w-4" />
            Build Your First Routine
          </Button>
        </Link>
      </Card>
    );
  }

  if (todayDay?.isRestDay) {
    return (
      <Card className="border-border bg-gradient-to-br from-card to-blue-500/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                Rest & Recovery
              </Badge>
            </div>
            <Moon className="h-5 w-5 text-blue-400" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground pt-1">
            Scheduled Recovery Day
          </CardTitle>
          <CardDescription className="text-xs">
            Allow muscle fibers to repair, central nervous system to recharge, and hydrate adequately.
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 pt-3">
          <span>Target: Rest, hydration & protein intake</span>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-xs h-8 gap-1">
              View Week Schedule
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px] font-bold">
                TODAY&apos;S WORKOUT
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground">
              {todayDay?.label || 'Scheduled Workout'}
            </CardTitle>
            <CardDescription className="text-xs">
              {todayDay?.exerciseCount || 0} planned exercises • Estimated ~45 mins
            </CardDescription>
          </div>

          <Link href="/execute">
            <Button
              size="default"
              className="gap-2 font-bold shadow-md h-10 px-5 w-full sm:w-auto"
              aria-label="Start today's workout"
            >
              <Play className="h-4 w-4 fill-current" />
              Start Workout
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {todayDay && todayDay.exercises.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {todayDay.exercises.slice(0, 4).map((ex: CalendarExerciseItem, i: number) => (
              <div
                key={ex.id}
                className="p-2.5 rounded-lg border border-border/80 bg-card/80 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-foreground block">
                    {i + 1}. {ex.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {ex.defaultSets} sets × {ex.defaultReps} reps
                    {ex.defaultWeightKg ? ` @ ${ex.defaultWeightKg} kg` : ''}
                  </span>
                </div>
                {ex.primaryMuscle && (
                  <Badge variant="outline" className="text-[9px] py-0">
                    {ex.primaryMuscle}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No specific exercises configured for this day.</p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3 pb-3 text-xs text-muted-foreground">
        <Link href="/workout">
          <Button variant="ghost" size="sm" className="text-xs h-8">
            Edit Routine
          </Button>
        </Link>
        <Link href="/calendar">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
            Browse Full Calendar
            <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
