'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Flame, ChevronRight } from 'lucide-react';
import { ProgressRing } from '@/components/ui/visual/ProgressRing';
import type { ProgressSummary } from '@/lib/services/progress.service';

interface WeeklyFrequencyCardProps {
  stats: ProgressSummary | null;
}

export function WeeklyFrequencyCard({ stats }: WeeklyFrequencyCardProps) {
  const frequencyPct = stats?.frequencyPct ?? 0;
  const completed = stats?.completedWorkouts ?? 0;
  const planned = stats?.plannedWorkouts ?? 0;
  const streak = stats?.streak ?? 0;

  return (
    <Card className="relative overflow-hidden bg-card border-border/80 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Weekly Activity
          </span>
        </div>

        <Link href="/progress">
          <Badge variant="outline" className="text-[11px] font-semibold gap-1 text-primary hover:bg-primary/10">
            Analytics
            <ChevronRight className="h-3 w-3" />
          </Badge>
        </Link>
      </div>

      <CardContent className="p-0 pt-4 flex items-center justify-between">
        {/* Progress Ring */}
        <ProgressRing
          percentage={frequencyPct}
          size={78}
          strokeWidth={7}
          color="stroke-primary"
          centerContent={
            <span className="text-base font-black tracking-tight text-foreground">
              {frequencyPct}%
            </span>
          }
        />

        {/* Metric Details */}
        <div className="space-y-2 text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full border border-orange-400/20 w-fit ml-auto">
            <Flame className="h-3.5 w-3.5 fill-current" />
            <span>{streak}d streak</span>
          </div>

          <div>
            <div className="text-xl font-black text-foreground">
              {completed} <span className="text-sm font-medium text-muted-foreground">/ {planned}</span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">Workouts Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
