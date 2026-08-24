'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { TodayWorkoutCard } from '@/components/dashboard/TodayWorkoutCard';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { WeeklyFrequencyCard } from '@/components/dashboard/WeeklyFrequencyCard';
import { ActiveGoalWidget } from '@/components/dashboard/ActiveGoalWidget';
import { BiometricsOverview } from '@/components/dashboard/BiometricsOverview';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { formatDateISO } from '@/lib/utils/calendar';
import type { WeeklyScheduleResponse } from '@/lib/services/calendar.service';
import type { UserProfileResponse } from '@/lib/services/profile.service';
import type { GoalWithCalculatedProgress } from '@/lib/services/goal.service';
import type { ProgressSummary } from '@/lib/services/progress.service';

export default function DashboardPage() {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [activeGoal, setActiveGoal] = useState<GoalWithCalculatedProgress | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<ProgressSummary | null>(null);
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string>(formatDateISO(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [weekRes, profileRes, goalRes, statsRes] = await Promise.all([
        fetch('/api/calendar/week'),
        fetch('/api/profile'),
        fetch('/api/goals/active'),
        fetch('/api/stats?period=week'),
      ]);

      if (weekRes.ok) {
        const weekJson: WeeklyScheduleResponse = await weekRes.json();
        setWeeklySchedule(weekJson);
        setSelectedDayDateStr(weekJson.todayStr);
      }

      if (profileRes.ok) {
        const profileJson: UserProfileResponse = await profileRes.json();
        setProfileData(profileJson);
      }

      if (goalRes.ok) {
        const goalJson = await goalRes.json();
        setActiveGoal(goalJson.activeGoal);
      }

      if (statsRes.ok) {
        const statsJson: ProgressSummary = await statsRes.json();
        setWeeklyStats(statsJson);
      }
    } catch {
      setHasError(true);
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

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-6 space-y-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Failed to Load Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            We encountered a network error while fetching your fitness data. Please try again.
          </p>
        </div>
        <Button
          type="button"
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const todayDay = weeklySchedule?.days.find((d) => d.isToday);
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Welcome & Greeting Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Welcome, <span className="text-primary">{profileData?.name || 'Athlete'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formattedToday} •{' '}
            {todayDay?.isRestDay
              ? 'Scheduled recovery day'
              : todayDay?.label
              ? `Today: ${todayDay.label}`
              : 'Stay consistent and hit your daily targets'}
          </p>
        </div>

        {todayDay && (
          <Badge
            variant={todayDay.isRestDay ? 'secondary' : 'default'}
            className="w-fit text-[11px] font-semibold"
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

      {/* 2. Calendar Weekly Schedule Strip */}
      <DashboardCalendar
        schedule={weeklySchedule}
        selectedDateStr={selectedDayDateStr}
        onSelectDate={setSelectedDayDateStr}
      />

      {/* 3. Weekly Frequency & Active Goal 2-Column Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <WeeklyFrequencyCard stats={weeklyStats} />
        <ActiveGoalWidget activeGoal={activeGoal} />
      </div>

      {/* 4. Biometrics & Nutrition Overview */}
      <BiometricsOverview profileData={profileData} />
    </div>
  );
}
