'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Plus, ChevronRight, Clock } from 'lucide-react';
import type { GoalWithCalculatedProgress } from '@/lib/services/goal.service';

interface ActiveGoalWidgetProps {
  activeGoal: GoalWithCalculatedProgress | null;
}

export function ActiveGoalWidget({ activeGoal }: ActiveGoalWidgetProps) {
  if (!activeGoal) {
    return (
      <Card className="border-dashed border-border bg-card/60 shadow-sm flex flex-col justify-between">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground">Active Goal</CardTitle>
          </div>
          <CardDescription className="text-xs">
            No active goal currently set. Target a specific milestone to maintain focus.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <Link href="/goals">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold w-full h-8">
              <Plus className="h-3.5 w-3.5" />
              Set Your Goal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">
              {activeGoal.title}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {activeGoal.currentValue} / {activeGoal.targetValue} {activeGoal.unit}
          </CardDescription>
        </div>

        <Link href="/goals">
          <Badge
            variant={activeGoal.trackStatus === 'ON_TRACK' ? 'secondary' : 'default'}
            className="text-[10px] gap-1 cursor-pointer hover:bg-muted"
          >
            {activeGoal.trackStatus.replace('_', ' ')}
            <ChevronRight className="h-2.5 w-2.5" />
          </Badge>
        </Link>
      </CardHeader>

      <CardContent className="space-y-2 pt-1">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-2xl font-black text-primary">{activeGoal.progressPct}%</span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 text-primary" />
            <span>{activeGoal.daysRemaining} days left</span>
          </div>
        </div>

        <Progress
          value={activeGoal.progressPct}
          className="h-2"
          role="progressbar"
          aria-valuenow={activeGoal.progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Goal progress: ${activeGoal.progressPct}%`}
        />
      </CardContent>
    </Card>
  );
}
