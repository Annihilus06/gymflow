'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
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
  Zap,
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
        setSuccessMessage('Active routine updated!');
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
        setSuccessMessage(`Cloned "${cloned.name}"`);
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
    if (!confirm(`Delete routine "${name}"?`)) return;

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-primary" />
            Training Routines
          </h1>
          <p className="text-xs text-muted-foreground">
            Custom weekly splits, volume allocation, and exercise plans.
          </p>
        </div>
        <Link href="/routines/new">
          <Button className="font-bold gap-2 shadow-sm w-full sm:w-auto h-10 px-5">
            <Plus className="h-4 w-4" />
            New Routine
          </Button>
        </Link>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Active Weekly Routine Visual Split */}
      {activeRoutine ? (
        <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 shadow-md">
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow-sm">
                  ACTIVE SPLIT
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{activeRoutine.name}</h2>
              </div>
              <Link href={`/routines/${activeRoutine.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold h-8">
                  <Edit className="h-3 w-3" />
                  Edit Plan
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="text-primary font-bold">{activeRoutine.workoutDaysCount} Training Days</span>
              <span>•</span>
              <span>{activeRoutine.restDaysCount} Rest Days</span>
              <span>•</span>
              <span>{activeRoutine.totalExercises} Exercises</span>
            </div>

            {/* 7-Day Visual Split Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 pt-1">
              {activeRoutine.days.map((day) => {
                const dayShort = day.dayOfWeek.slice(0, 3);
                return (
                  <Link
                    key={day.id}
                    href={`/routines/${activeRoutine.id}?day=${day.dayOfWeek}`}
                    className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition-all hover:border-primary/50 ${
                      day.isRestDay
                        ? 'border-border/40 bg-muted/20 text-muted-foreground'
                        : 'border-border/80 bg-card/80 text-foreground ring-1 ring-border/20 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{dayShort}</span>
                        {day.isRestDay ? (
                          <Moon className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs font-bold truncate">
                        {day.isRestDay ? 'Recovery' : day.label || 'Workout'}
                      </p>
                    </div>

                    <div className="pt-2 text-[10px] font-semibold text-muted-foreground">
                      {day.isRestDay ? 'Rest Day' : `${day.exerciseCount} exercises`}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed border-border/80 p-8 text-center bg-card/40 rounded-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold">No Active Routine</CardTitle>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Build your weekly workout schedule to assign daily muscle groups and exercises.
          </p>
          <Link href="/routines/new">
            <Button className="font-bold text-xs gap-2">
              <Plus className="h-4 w-4" />
              Build Your First Routine
            </Button>
          </Link>
        </Card>
      )}

      {/* Routine Collection List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          All Saved Routines ({routines.length})
        </h3>

        {routines.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No routines saved yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {routines.map((routine) => (
              <Card key={routine.id} className="border-border/80 bg-card hover:border-border transition-colors p-4 space-y-3 shadow-sm rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{routine.name}</span>
                      {routine.isActive && (
                        <Badge variant="default" className="text-[9px] font-black uppercase px-1.5 py-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    {routine.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {routine.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground border-y border-border/40 py-2">
                  <span>{routine.workoutDaysCount} Training Days</span>
                  <span>•</span>
                  <span>{routine.restDaysCount} Rest</span>
                  <span>•</span>
                  <span>{routine.totalExercises} Exercises</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {!routine.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingId === routine.id}
                        onClick={() => handleActivate(routine.id)}
                        className="text-xs h-7 font-bold text-primary hover:text-primary"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoadingId === routine.id}
                      onClick={() => handleDuplicate(routine.id)}
                      className="text-xs h-7 text-muted-foreground"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Clone
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoadingId === routine.id}
                      onClick={() => handleDelete(routine.id, routine.name)}
                      className="text-xs h-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <Link href={`/routines/${routine.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7 font-bold gap-1">
                      Edit
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
