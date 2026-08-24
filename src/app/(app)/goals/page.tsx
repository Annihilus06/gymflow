'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Trophy,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  AlertCircle,
  TrendingUp,
  X,
  Ban,
} from 'lucide-react';
import type { GoalWithCalculatedProgress } from '@/lib/services/goal.service';

const GOAL_TYPE_OPTIONS = [
  { value: 'WEIGHT_LOSS', label: 'Weight Loss', defaultUnit: 'kg' },
  { value: 'MUSCLE_GAIN', label: 'Muscle Gain', defaultUnit: 'kg' },
  { value: 'STRENGTH_TARGET', label: 'Strength Target', defaultUnit: 'kg' },
  { value: 'WORKOUT_FREQUENCY', label: 'Workout Count', defaultUnit: 'workouts' },
  { value: 'CUSTOM', label: 'Custom Measurable Target', defaultUnit: 'units' },
];

export default function GoalsPage() {
  const [activeGoal, setActiveGoal] = useState<GoalWithCalculatedProgress | null>(null);
  const [goalHistory, setGoalHistory] = useState<GoalWithCalculatedProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Goal Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'WEIGHT_LOSS',
    startValue: 80,
    targetValue: 75,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  // Update Progress Modal State
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateValue, setUpdateValue] = useState<number>(0);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setActiveGoal(data.activeGoal);
        setGoalHistory(data.history || []);
        if (data.activeGoal) {
          setUpdateValue(data.activeGoal.currentValue ?? data.activeGoal.startValue ?? 0);
        }
      } else {
        setErrorMessage('Failed to load goals.');
      }
    } catch {
      setErrorMessage('Network error while fetching goals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          type: createForm.type,
          startValue: Number(createForm.startValue),
          targetValue: Number(createForm.targetValue),
          targetDate: new Date(createForm.targetDate || Date.now()).toISOString(),
          description: createForm.description || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create goal.');
      }

      await fetchGoals();
      setIsCreateOpen(false);
      setSuccessMessage('Goal created successfully!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create goal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/goals/${activeGoal.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue: Number(updateValue),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update progress.');
      }

      await fetchGoals();
      setIsUpdateOpen(false);
      setSuccessMessage('Goal progress updated!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update progress.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteGoal = async () => {
    if (!activeGoal) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/goals/${activeGoal.id}/complete`, { method: 'POST' });
      if (res.ok) {
        await fetchGoals();
        setSuccessMessage('🎉 Congratulations! Goal marked as completed!');
      }
    } catch {
      setErrorMessage('Failed to complete goal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelGoal = async () => {
    if (!activeGoal) return;
    if (!confirm('Are you sure you want to cancel this goal? You will be able to set a new goal.')) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/goals/${activeGoal.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        await fetchGoals();
        setSuccessMessage('Goal cancelled. You can now set a new active goal.');
      }
    } catch {
      setErrorMessage('Failed to cancel goal.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" />
            Fitness Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            Set focused measurable milestones and track deterministic progress.
          </p>
        </div>

        {!activeGoal && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 font-semibold text-xs h-9"
          >
            <Plus className="h-4 w-4" />
            Set New Goal
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Goal Section */}
      {activeGoal ? (
        <Card className="border-primary/40 bg-gradient-to-br from-card to-primary/5 shadow-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                    ACTIVE GOAL
                  </Badge>
                  <Badge
                    variant={
                      activeGoal.trackStatus === 'ON_TRACK'
                        ? 'secondary'
                        : activeGoal.trackStatus === 'COMPLETED'
                        ? 'default'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {activeGoal.trackStatus.replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {activeGoal.title}
                </CardTitle>
                {activeGoal.description && (
                  <CardDescription className="text-xs">{activeGoal.description}</CardDescription>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card/60 px-3 py-1.5 rounded-lg border border-border/50">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  <strong>{activeGoal.daysRemaining}</strong> days left
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-5">
            {/* Progress Bar & Value Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Current Progress</span>
                <span className="text-primary text-sm font-bold">{activeGoal.progressPct}%</span>
              </div>
              <Progress value={activeGoal.progressPct} className="h-2.5" />

              <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground/80">
                    Start
                  </span>
                  <span className="font-semibold text-foreground">
                    {activeGoal.startValue} {activeGoal.unit}
                  </span>
                </div>

                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-primary">
                    Current
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {activeGoal.currentValue} {activeGoal.unit}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground/80">
                    Target
                  </span>
                  <span className="font-semibold text-foreground">
                    {activeGoal.targetValue} {activeGoal.unit}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 bg-muted/10">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateOpen(true)}
                className="text-xs h-8 gap-1.5"
              >
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Log Progress
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isSaving}
                onClick={handleCompleteGoal}
                className="text-xs h-8 gap-1.5 font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Completed
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={handleCancelGoal}
              className="text-xs h-8 text-muted-foreground hover:text-destructive gap-1"
            >
              <Ban className="h-3 w-3" />
              Cancel Goal
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-dashed border-border bg-card/40 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">No Active Goal</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Focus on one single milestone at a time to maximize consistency and accountability.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs font-semibold gap-1.5 mt-2"
          >
            <Plus className="h-4 w-4" />
            Create Your Active Goal
          </Button>
        </Card>
      )}

      {/* Goal History Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Goal History ({goalHistory.length})
        </h2>

        {goalHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No past completed goals yet.</p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {goalHistory.map((g) => (
              <Card key={g.id} className="border-border/80 bg-card p-3.5 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-foreground block text-sm">{g.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {g.startValue} → {g.targetValue} {g.unit}
                    </span>
                  </div>
                  <Badge
                    variant={g.status === 'COMPLETED' ? 'default' : 'secondary'}
                    className="text-[9px]"
                  >
                    {g.status}
                  </Badge>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Final Progress</span>
                    <span className="font-semibold text-foreground">{g.progressPct}%</span>
                  </div>
                  <Progress value={g.progressPct} className="h-1.5" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Set Your Active Goal
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="goalTitle">Goal Title</Label>
                <Input
                  id="goalTitle"
                  required
                  placeholder="e.g. Lose 5 kg by Summer, Bench 100 kg"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="goalType">Goal Category</Label>
                <select
                  id="goalType"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {GOAL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.defaultUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="startValue">Starting Value</Label>
                  <Input
                    id="startValue"
                    type="number"
                    step="0.1"
                    required
                    value={createForm.startValue}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, startValue: parseFloat(e.target.value) })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    step="0.1"
                    required
                    value={createForm.targetValue}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, targetValue: parseFloat(e.target.value) })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="targetDate">Target Deadline</Label>
                <Input
                  id="targetDate"
                  type="date"
                  required
                  value={createForm.targetDate}
                  onChange={(e) => setCreateForm({ ...createForm, targetDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Notes / Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g. Training 4 days a week with caloric deficit"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="text-xs h-8 font-semibold"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Start Goal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {isUpdateOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Update Goal Progress
              </h3>
              <button
                type="button"
                onClick={() => setIsUpdateOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProgress} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="currentVal">
                  New Current Value ({activeGoal.unit})
                </Label>
                <Input
                  id="currentVal"
                  type="number"
                  step="0.1"
                  required
                  value={updateValue}
                  onChange={(e) => setUpdateValue(parseFloat(e.target.value))}
                  className="h-9 text-sm font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUpdateOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="text-xs h-8 font-semibold"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Progress'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
