'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, CheckCircle2, Moon, ChevronRight } from 'lucide-react';
import type { WeeklyScheduleResponse, CalendarDayEvent } from '@/lib/services/calendar.service';

interface DashboardCalendarProps {
  schedule: WeeklyScheduleResponse | null;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

export function DashboardCalendar({
  schedule,
  selectedDateStr,
  onSelectDate,
}: DashboardCalendarProps) {
  if (!schedule || !schedule.days || schedule.days.length === 0) {
    return null;
  }

  const selectedDay =
    schedule.days.find((d: CalendarDayEvent) => d.dateStr === selectedDateStr) ||
    schedule.days.find((d: CalendarDayEvent) => d.isToday) ||
    schedule.days[0];

  const routineName = schedule.activeRoutine?.name || 'Weekly Calendar';

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Weekly Schedule & Calendar
          </CardTitle>
          <CardDescription className="text-xs">
            {schedule.activeRoutine
              ? `${routineName} • Tap any day to inspect or plan workouts.`
              : 'Interactive 7-day calendar • Tap any day to view or configure training.'}
          </CardDescription>
        </div>

        <Link href="/calendar">
          <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-muted">
            Full Calendar
            <ChevronRight className="h-2.5 w-2.5" />
          </Badge>
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 7-Day Interactive Calendar Strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {schedule.days.map((day: CalendarDayEvent) => {
            const isSelected = day.dateStr === selectedDateStr;
            const isCompleted = day.status === 'COMPLETED';
            const isMissed = day.status === 'MISSED';
            const shortDay = day.dayOfWeek.slice(0, 3);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDate(day.dateStr)}
                className={`relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all min-h-[76px] ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : day.isToday
                    ? 'border-primary/50 bg-card hover:bg-muted/40'
                    : 'border-border/60 bg-card/50 hover:bg-muted/30'
                }`}
                aria-label={`View schedule for ${day.dayOfWeek}, ${day.dateStr}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {shortDay}
                  </span>
                  {day.isToday && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Today" />
                  )}
                </div>

                <span
                  className={`text-sm font-black my-0.5 ${
                    day.isToday ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Status Indicator */}
                <div className="w-full flex items-center justify-center">
                  {isCompleted ? (
                    <span className="inline-flex items-center text-[9px] font-bold text-emerald-500 gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Done
                    </span>
                  ) : day.isRestDay ? (
                    <span className="text-[9px] text-blue-400 font-semibold flex items-center gap-0.5">
                      <Moon className="h-2 w-2" />
                      Rest
                    </span>
                  ) : isMissed ? (
                    <span className="text-[9px] text-amber-500 font-semibold">Missed</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground truncate max-w-[42px]">
                      {day.label ? day.label.split(' ')[0] : `${day.exerciseCount} ex`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Exercise Preview */}
        {selectedDay && (
          <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                {selectedDay.dayOfWeek} ({selectedDay.dateStr}) • {selectedDay.isRestDay ? 'Rest / Recovery' : selectedDay.label || 'Workout Day'}
              </span>
              {!selectedDay.isRestDay && (
                <Badge variant="outline" className="text-[10px]">
                  {selectedDay.exercises.length} exercises
                </Badge>
              )}
            </div>

            {selectedDay.exercises.length > 0 ? (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {selectedDay.exercises.map((ex, i) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-2 rounded bg-card border border-border/50 text-[11px]"
                  >
                    <span className="font-semibold text-foreground truncate">
                      {i + 1}. {ex.name}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0 ml-2">
                      {ex.defaultSets}×{ex.defaultReps}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <p className="text-muted-foreground text-[11px]">
                  {selectedDay.isRestDay
                    ? 'Scheduled recovery day for muscle repair.'
                    : 'No specific exercises assigned yet for this day.'}
                </p>
                <Link href="/workout">
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary">
                    + Configure Split
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
