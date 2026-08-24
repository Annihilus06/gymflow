'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Plus,
  Copy,
  Trash2,
  Edit,
  CheckCircle,
  Calendar,
  Loader2,
  AlertCircle,
  Moon,
  ChevronRight,
} from 'lucide-react';

interface RoutineDaySummary {
  id: string;
  dayOfWeek: string;
  label: string | null;
  isRestDay: boolean;
  exerciseCount: number;
}

interface RoutineSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  workoutDaysCount: number;
  restDaysCount: number;
  totalExercises: number;
  days: RoutineDaySummary[];
  createdAt: string;
  updatedAt: string;
}

export default function WorkoutPage() {
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRoutines = useCallback(async () => {
    try {
      const res = await fetch('/api/routines');
      if (res.ok) {
        const data = await res.json();
        setRoutines(data);
      }
    } catch {
      setErrorMessage('Failed to load routines.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleActivate = async (routineId: string) => {
    setActionLoadingId(routineId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/routines/${routineId}/activate`, { method: 'POST' });
      if (res.ok) {
        setSuccessMessage('Active weekly routine updated!');
        await fetchRoutines();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to activate routine.');
      }
    } catch {
      setErrorMessage('Failed to activate routine.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (routineId: string) => {
    setActionLoadingId(routineId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/routines/${routineId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const cloned = await res.json();
        setSuccessMessage(`Cloned routine as "${cloned.name}"`);
        await fetchRoutines();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to duplicate routine.');
      }
    } catch {
      setErrorMessage('Failed to duplicate routine.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (routineId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setActionLoadingId(routineId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/routines/${routineId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Routine deleted.');
        await fetchRoutines();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to delete routine.');
      }
    } catch {
      setErrorMessage('Failed to delete routine.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeRoutine = routines.find((r) => r.isActive);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workout & Routines</h1>
          <p className="text-sm text-muted-foreground">
            Design your weekly split, configure muscle groups, and manage planned training days.
          </p>
        </div>
        <Link href="/routines/new">
          <Button className="font-semibold gap-2 shadow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Create New Routine
          </Button>
        </Link>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Weekly Routine Overview */}
      {activeRoutine ? (
        <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary text-primary-foreground font-semibold">
                  Active Weekly Split
                </Badge>
                <CardTitle className="text-xl font-bold">{activeRoutine.name}</CardTitle>
              </div>
              <Link href={`/routines/${activeRoutine.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 font-medium">
                  <Edit className="h-3.5 w-3.5" />
                  Edit Split
                </Button>
              </Link>
            </div>
            {activeRoutine.description && (
              <CardDescription className="text-sm pt-1">{activeRoutine.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-y border-border/50 py-2">
              <div>
                <span className="font-semibold text-foreground">{activeRoutine.workoutDaysCount}</span> Workout Days
              </div>
              <div>•</div>
              <div>
                <span className="font-semibold text-foreground">{activeRoutine.restDaysCount}</span> Rest Days
              </div>
              <div>•</div>
              <div>
                <span className="font-semibold text-foreground">{activeRoutine.totalExercises}</span> Planned Exercises
              </div>
            </div>

            {/* 7-Day Visual Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {activeRoutine.days.map((day) => {
                const dayShort = day.dayOfWeek.slice(0, 3);
                return (
                  <Link
                    key={day.id}
                    href={`/routines/${activeRoutine.id}?day=${day.dayOfWeek}`}
                    className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all hover:border-primary/50 hover:shadow-sm ${
                      day.isRestDay
                        ? 'border-border/40 bg-muted/30 text-muted-foreground'
                        : 'border-border/80 bg-card/60 text-card-foreground ring-1 ring-border/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">{dayShort}</span>
                        {day.isRestDay ? (
                          <Moon className="h-3.5 w-3.5 text-muted-foreground/70" />
                        ) : (
                          <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs font-semibold line-clamp-1">
                        {day.isRestDay ? 'Rest Day' : day.label || 'Workout'}
                      </p>
                    </div>

                    <div className="pt-2 text-[11px] text-muted-foreground">
                      {day.isRestDay ? 'Recovery' : `${day.exerciseCount} exercises`}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border/80 p-8 text-center bg-card/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">No Active Routine</CardTitle>
          <CardDescription className="max-w-md mx-auto mt-1 mb-4">
            Build your planned workout schedule to customize your training days and exercise order.
          </CardDescription>
          <Link href="/routines/new">
            <Button className="font-semibold gap-2">
              <Plus className="h-4 w-4" />
              Build Your First Routine
            </Button>
          </Link>
        </Card>
      )}

      {/* Routine Collection List */}
      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-bold tracking-tight">All Saved Routines</h2>

        {routines.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No routines found. Click &quot;Create New Routine&quot; to get started.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {routines.map((routine) => (
              <Card key={routine.id} className="border-border/70 bg-card hover:border-border transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{routine.name}</CardTitle>
                        {routine.isActive && (
                          <Badge variant="success" className="text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>
                      {routine.description && (
                        <CardDescription className="text-xs line-clamp-1 mt-0.5">
                          {routine.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{routine.workoutDaysCount} Training Days</span>
                    <span>•</span>
                    <span>{routine.restDaysCount} Rest Days</span>
                    <span>•</span>
                    <span>{routine.totalExercises} Exercises</span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border/50 pt-2 pb-2">
                  <div className="flex items-center gap-1">
                    {!routine.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingId === routine.id}
                        onClick={() => handleActivate(routine.id)}
                        className="text-xs h-8 text-primary hover:text-primary"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoadingId === routine.id}
                      onClick={() => handleDuplicate(routine.id)}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoadingId === routine.id}
                      onClick={() => handleDelete(routine.id, routine.name)}
                      className="text-xs h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <Link href={`/routines/${routine.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                      Edit
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
