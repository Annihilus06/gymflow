'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Activity, Flame, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { TodayWorkoutCard } from '@/components/dashboard/TodayWorkoutCard';
import { MuscleWikiExplorer } from '@/components/dashboard/MuscleWikiExplorer';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type { WeeklyScheduleResponse } from '@/lib/services/calendar.service';
import type { UserProfileResponse } from '@/lib/services/profile.service';
import type { GoalWithCalculatedProgress } from '@/lib/services/goal.service';
import type { ProgressSummary } from '@/lib/services/progress.service';

export default function DashboardPage() {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [activeGoal, setActiveGoal] = useState<GoalWithCalculatedProgress | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [weekRes, profileRes, goalRes, statsRes] = await Promise.allSettled([
        fetch('/api/calendar/week'),
        fetch('/api/profile'),
        fetch('/api/goals/active'),
        fetch('/api/stats?period=week'),
      ]);

      if (weekRes.status === 'fulfilled' && weekRes.value.ok) {
        try {
          const weekJson: WeeklyScheduleResponse = await weekRes.value.json();
          setWeeklySchedule(weekJson);
        } catch {
          // ignore
        }
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        try {
          const profileJson: UserProfileResponse = await profileRes.value.json();
          setProfileData(profileJson);
        } catch {
          // ignore
        }
      }

      if (goalRes.status === 'fulfilled' && goalRes.value.ok) {
        try {
          const goalJson = await goalRes.value.json();
          setActiveGoal(goalJson.activeGoal ?? null);
        } catch {
          // ignore
        }
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        try {
          const statsJson: ProgressSummary = await statsRes.value.json();
          setWeeklyStats(statsJson);
        } catch {
          // ignore
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const todayDay = weeklySchedule?.days?.find((d) => d.isToday);
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const frequencyPct = weeklyStats?.frequencyPct ?? 0;
  const completedWorkouts = weeklyStats?.completedWorkouts ?? 0;
  const plannedWorkouts = weeklyStats?.plannedWorkouts ?? 0;
  const streak = weeklyStats?.streak ?? 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Greeting Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Welcome, <span className="text-primary">{profileData?.name || 'Athlete'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formattedToday} • {todayDay?.isRestDay ? 'Scheduled recovery day' : todayDay?.label ? `Today: ${todayDay.label}` : 'Consistent daily progress'}
          </p>
        </div>

        {todayDay && (
          <Badge
            variant={todayDay.isRestDay ? 'secondary' : 'default'}
            className="w-fit text-[11px] font-bold"
          >
            {todayDay.isRestDay ? 'Recovery Day' : 'Training Day'}
          </Badge>
        )}
      </div>

      {/* 1. Today's Workout Focus Card */}
      <TodayWorkoutCard
        todayDay={todayDay}
        hasActiveRoutine={Boolean(weeklySchedule?.activeRoutine)}
      />

      {/* 2. Visual Progress Bars (Goal Achievement & Weekly Frequency) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Active Goal Achievement Progress Bar */}
        <Card className="bg-card border-border/80 p-4 space-y-3 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block truncate max-w-[170px]">
                  {activeGoal?.title || 'Active Goal'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {activeGoal ? `${activeGoal.currentValue} / ${activeGoal.targetValue} ${activeGoal.unit}` : 'No goal set'}
                </span>
              </div>
            </div>

            <Link href="/goals">
              <Badge variant="outline" className="text-[10px] font-bold gap-1 text-primary hover:bg-primary/10">
                {activeGoal ? `${activeGoal.progressPct}%` : 'Set Goal'}
                <ChevronRight className="h-2.5 w-2.5" />
              </Badge>
            </Link>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground text-[11px]">Goal Progress</span>
              <span className="text-primary">{activeGoal?.progressPct ?? 0}%</span>
            </div>
            <Progress
              value={activeGoal?.progressPct ?? 0}
              className="h-2.5 rounded-full"
            />
          </div>
        </Card>

        {/* Weekly Frequency Progress Bar */}
        <Card className="bg-card border-border/80 p-4 space-y-3 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">Weekly Frequency</span>
                <span className="text-[10px] text-muted-foreground">
                  {completedWorkouts} of {plannedWorkouts} workouts completed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
              <Flame className="h-3 w-3 fill-current" />
              <span>{streak}d</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground text-[11px]">Completion Rate</span>
              <span className="text-orange-400">{frequencyPct}%</span>
            </div>
            <Progress
              value={frequencyPct}
              className="h-2.5 rounded-full"
            />
          </div>
        </Card>
      </div>

      {/* 3. Interactive Muscle Wiki & Form Video Guides */}
      <MuscleWikiExplorer />
    </div>
  );
}
