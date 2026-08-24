'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Flame, ChevronRight } from 'lucide-react';
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
    <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground">
              Weekly Frequency
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {completed} of {planned} planned workouts completed
          </CardDescription>
        </div>

        <Link href="/progress">
          <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-muted">
            Stats
            <ChevronRight className="h-2.5 w-2.5" />
          </Badge>
        </Link>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-black text-primary">{frequencyPct}%</span>
          <div className="flex items-center gap-1 text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
            <Flame className="h-3.5 w-3.5 fill-current" />
            <span>{streak} {streak === 1 ? 'day' : 'days'} streak</span>
          </div>
        </div>

        <div className="space-y-1">
          <Progress
            value={frequencyPct}
            className="h-2"
            role="progressbar"
            aria-valuenow={frequencyPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Weekly workout completion frequency"
          />
        </div>
      </CardContent>
    </Card>
  );
}
