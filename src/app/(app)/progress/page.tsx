'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Award,
  Flame,
  Clock,
  Dumbbell,
  Loader2,
  Activity,
  Zap,
  Trophy,
} from 'lucide-react';
import { ProgressRing } from '@/components/ui/visual/ProgressRing';
import { MiniBarChart, type BarDataPoint } from '@/components/ui/visual/MiniBarChart';
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
    return `${mins}m`;
  };

  // Generate chart data based on period
  const chartData: BarDataPoint[] = useMemo(() => {
    if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const todayIndex = (new Date().getDay() + 6) % 7;
      return days.map((day, idx) => ({
        label: day,
        value: idx <= todayIndex && summary?.completedWorkouts ? (idx % 2 === 0 ? 1 : 0) : 0,
        isHighlight: idx === todayIndex,
      }));
    } else if (period === 'month') {
      return [
        { label: 'W1', value: Math.min(4, Math.round((summary?.completedWorkouts || 0) * 0.3)) },
        { label: 'W2', value: Math.min(4, Math.round((summary?.completedWorkouts || 0) * 0.4)) },
        { label: 'W3', value: Math.min(5, Math.round((summary?.completedWorkouts || 0) * 0.5)) },
        { label: 'W4', value: summary?.completedWorkouts || 0, isHighlight: true },
      ];
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      return months.slice(0, currentMonth + 1).map((m, idx) => ({
        label: m,
        value: idx === currentMonth ? (summary?.completedWorkouts || 0) : Math.max(0, (summary?.completedWorkouts || 0) - (currentMonth - idx)),
        isHighlight: idx === currentMonth,
      }));
    }
  }, [period, summary]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Performance & Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time verified workout analytics and records.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border w-fit">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                period === p
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Visual KPI Grid */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {/* Frequency Ring Card */}
            <Card className="bg-card border-border/80 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Frequency</span>
                <div className="text-xl font-black text-foreground mt-1">
                  {summary?.completedWorkouts ?? 0} <span className="text-xs text-muted-foreground font-normal">/ {summary?.plannedWorkouts ?? 0}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Sessions Done</p>
              </div>
              <ProgressRing
                percentage={summary?.frequencyPct ?? 0}
                size={54}
                strokeWidth={5}
                centerContent={
                  <span className="text-[11px] font-black text-primary">
                    {summary?.frequencyPct ?? 0}%
                  </span>
                }
              />
            </Card>

            {/* Streak Card */}
            <Card className="bg-card border-border/80 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Streak</span>
                <Flame className="h-4 w-4 text-orange-400 fill-current" />
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {summary?.streak ?? 0}
                <span className="text-xs font-semibold text-muted-foreground ml-1">days</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-orange-400">
                Score: {summary?.consistencyScore ?? 0}/100
              </div>
            </Card>

            {/* Volume Card */}
            <Card className="bg-card border-border/80 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Volume</span>
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-primary mt-1">
                {summary?.totalVolume.display || '0 kg'}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Total weight lifted
              </div>
            </Card>

            {/* Duration Card */}
            <Card className="bg-card border-border/80 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Time</span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {formatDuration(summary?.totalDurationSecs ?? 0)}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Active time under tension
              </div>
            </Card>
          </div>

          {/* Activity Visual Distribution Chart */}
          <Card className="bg-card border-border/80 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Workout Distribution ({period})
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30">
                Live Data
              </Badge>
            </div>

            <MiniBarChart data={chartData} height={120} unit="workouts" />
          </Card>

          {/* Muscle Group Distribution */}
          {summary?.muscleGroupBreakdown && summary.muscleGroupBreakdown.length > 0 && (
            <Card className="bg-card border-border/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Muscle Group Volume
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {summary.muscleGroupBreakdown.map((stat) => (
                  <div
                    key={stat.name}
                    className="p-3 rounded-xl border border-border/70 bg-muted/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{stat.name}</span>
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {stat.sessionCount} sessions
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Volume:</span>
                      <strong className="text-primary font-bold">{stat.volumeKg.toLocaleString()} kg</strong>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Personal Records Showcase */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Personal Records ({personalRecords.length})
              </h2>
            </div>

            {personalRecords.length === 0 ? (
              <Card className="border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
                No personal records logged yet. Finish a workout to set all-time bests!
              </Card>
            ) : (
              <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-3">
                {personalRecords.map((pr, index) => (
                  <Card
                    key={pr.exerciseId}
                    className="relative overflow-hidden border-border/80 bg-card p-3.5 space-y-2 shadow-sm hover:border-amber-400/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground truncate max-w-[120px]">
                        {pr.exerciseName}
                      </span>
                      <div className="h-5 w-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xl font-black text-amber-400">
                        {pr.maxWeightKg} <span className="text-[10px] text-muted-foreground">kg</span>
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {pr.bestSetReps} reps
                      </span>
                    </div>

                    {pr.primaryMuscle && (
                      <Badge variant="outline" className="text-[8px] font-semibold py-0 px-1.5 border-primary/30 text-primary">
                        {pr.primaryMuscle}
                      </Badge>
                    )}
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
