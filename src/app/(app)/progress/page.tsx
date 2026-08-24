'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Award,
  Flame,
  Clock,
  Dumbbell,
  Loader2,
  Activity,
  Zap,
} from 'lucide-react';
import type { ProgressSummary, PersonalRecordItem } from '@/lib/services/progress.service';

export default function ProgressPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (selectedPeriod: 'week' | 'month' | 'year') => {
    setIsLoading(true);
    try {
      const [statsRes, prRes] = await Promise.all([
        fetch(`/api/stats?period=${selectedPeriod}`),
        fetch('/api/stats/records'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSummary(statsData);
      }

      if (prRes.ok) {
        const prData = await prRes.json();
        setPersonalRecords(prData.records || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [fetchStats, period]);

  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} mins`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Analytics & Progress
          </h1>
          <p className="text-sm text-muted-foreground">
            Deterministic performance metrics derived exclusively from verified completed workouts.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border w-fit">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              period === 'week'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              period === 'month'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('year')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              period === 'year'
                ? 'bg-card text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Frequency % */}
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Training Frequency</CardDescription>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black text-primary">
                  {summary?.frequencyPct ?? 0}%
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Progress value={summary?.frequencyPct ?? 0} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground pt-1">
                  {summary?.completedWorkouts ?? 0} of {summary?.plannedWorkouts ?? 0} planned workouts
                </p>
              </CardContent>
            </Card>

            {/* Streak & Consistency */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Active Streak</CardDescription>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {summary?.streak ?? 0} {summary?.streak === 1 ? 'day' : 'days'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">
                  Consistency Score: <strong>{summary?.consistencyScore ?? 0}/100</strong>
                </p>
              </CardContent>
            </Card>

            {/* Volume Lifted */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Total Volume Lifted</CardDescription>
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {summary?.totalVolume.display || '0 kg'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">Cumulative workload</p>
              </CardContent>
            </Card>

            {/* Duration */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">Total Training Time</CardDescription>
                  <Clock className="h-4 w-4 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {formatDuration(summary?.totalDurationSecs ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">Active execution duration</p>
              </CardContent>
            </Card>
          </div>

          {/* Muscle Group Distribution */}
          {summary?.muscleGroupBreakdown && summary.muscleGroupBreakdown.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Muscle Group Volume Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Workload allocation across anatomical body regions.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {summary.muscleGroupBreakdown.map((stat) => (
                    <div
                      key={stat.name}
                      className="p-3 rounded-lg border border-border/70 bg-muted/10 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{stat.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {stat.sessionCount} {stat.sessionCount === 1 ? 'session' : 'sessions'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Volume: <strong>{stat.volumeKg.toLocaleString()} kg</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Records (PRs) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Personal Records ({personalRecords.length})
            </h2>

            {personalRecords.length === 0 ? (
              <Card className="border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
                No personal records logged yet. Complete workouts in execution mode to set all-time bests!
              </Card>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {personalRecords.map((pr) => (
                  <Card key={pr.exerciseId} className="border-border/80 bg-card p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-sm text-foreground truncate">
                        {pr.exerciseName}
                      </span>
                      {pr.primaryMuscle && (
                        <Badge variant="secondary" className="text-[9px] py-0 px-1">
                          {pr.primaryMuscle}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xl font-black text-primary">
                        {pr.maxWeightKg} kg
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Best: {pr.bestSetReps} reps
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
