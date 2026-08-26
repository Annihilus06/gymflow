'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Dumbbell,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Moon,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  Copy,
  X,
  Sparkles,
  Target,
  Play,
} from 'lucide-react';
import { AIOptimizeModal } from '@/components/workout/AIOptimizeModal';
import { AIGoalAdvisorModal } from '@/components/workout/AIGoalAdvisorModal';
import { CreateCustomExerciseModal } from '@/components/exercises/CreateCustomExerciseModal';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';
import type {
  WorkoutOptimizationOutput,
  AIGoalSuggestionOutput,
} from '@/lib/validations/ai.schema';

const MUSCLE_TAGS = [
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Quads',
  'Hamstrings',
  'Biceps',
  'Triceps',
  'Arms',
  'Abs',
  'Core',
  'Full Body',
  'Push',
  'Pull',
  'Upper Body',
  'Lower Body',
];

interface ExerciseDetail {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string | null;
}

interface RoutineDayExerciseItem {
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  displayOrder: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number | null;
  notes: string | null;
  primaryMuscle: string | null;
  instructions?: string[];
  videoUrl?: string | null;
}

interface RoutineDayData {
  id: string;
  dayOfWeek: string;
  label: string | null;
  isRestDay: boolean;
  exercises: RoutineDayExerciseItem[];
}

interface RoutineDetailData {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  days: RoutineDayData[];
}

function RoutineDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routineId = (params?.id as string) || '';
  const initialDay = searchParams.get('day') || 'MONDAY';

  const [routine, setRoutine] = useState<RoutineDetailData | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Exercise Library Modal State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string | null>(null);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  // Custom Exercise Creation Modal State
  const [isCreateCustomOpen, setIsCreateCustomOpen] = useState(false);

  // Form Video Guide Modal State
  const [formGuideExercise, setFormGuideExercise] = useState<{
    name: string;
    primaryMuscle?: string | null;
    videoUrl?: string | null;
    instructions?: string[];
  } | null>(null);

  // AI Optimization Modal State
  const [isAIOptimizeOpen, setIsAIOptimizeOpen] = useState(false);
  const [isAIOptimizing, setIsAIOptimizing] = useState(false);
  const [aiOptimizationResult, setAiOptimizationResult] = useState<WorkoutOptimizationOutput | null>(null);

  // AI Goal Advisor Modal State
  const [isGoalAdvisorOpen, setIsGoalAdvisorOpen] = useState(false);
  const [isGoalAdvisorLoading, setIsGoalAdvisorLoading] = useState(false);
  const [goalAdvisorResult, setGoalAdvisorResult] = useState<AIGoalSuggestionOutput | null>(null);

  const fetchRoutine = useCallback(async () => {
    try {
      const res = await fetch(`/api/routines/${routineId}`);
      if (!res.ok) {
        setErrorMessage('Routine not found or you do not have permission to view it.');
        setIsLoading(false);
        return;
      }
      const data: RoutineDetailData = await res.json();
      setRoutine(data);

      // Select requested day if query param exists
      const dayIdx = data.days.findIndex((d) => d.dayOfWeek === initialDay.toUpperCase());
      if (dayIdx >= 0) {
        setSelectedDayIndex(dayIdx);
      }
    } catch {
      setErrorMessage('Failed to load routine.');
    } finally {
      setIsLoading(false);
    }
  }, [routineId, initialDay]);

  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine]);

  // Fetch available exercises when library modal is opened
  const openExerciseLibrary = async () => {
    setIsLibraryOpen(true);
    if (allExercises.length === 0) {
      setIsLibraryLoading(true);
      try {
        const res = await fetch('/api/exercises');
        if (res.ok) {
          const json = await res.json();
          setAllExercises(json.exercises);
        }
      } catch {
        setErrorMessage('Failed to load exercise catalogue.');
      } finally {
        setIsLibraryLoading(false);
      }
    }
  };

  const currentDay = routine?.days[selectedDayIndex];

  // Update routine title / description
  const handleUpdateRoutineInfo = async (name: string, description: string) => {
    if (!name.trim()) return;
    try {
      await fetch(`/api/routines/${routineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      setSuccessMessage('Routine info saved.');
    } catch {
      setErrorMessage('Failed to update routine info.');
    }
  };

  // Toggle rest day
  const handleToggleRestDay = async (isRestDay: boolean) => {
    if (!currentDay) return;
    try {
      const res = await fetch(`/api/routines/${routineId}/days/${currentDay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRestDay }),
      });
      if (res.ok) {
        setRoutine((prev) => {
          if (!prev) return prev;
          const newDays = [...prev.days];
          if (newDays[selectedDayIndex]) {
            newDays[selectedDayIndex] = { ...newDays[selectedDayIndex], isRestDay };
          }
          return { ...prev, days: newDays };
        });
      }
    } catch {
      setErrorMessage('Failed to toggle rest day.');
    }
  };

  // Update Day Muscle Focus Label
  const handleUpdateDayLabel = async (label: string) => {
    if (!currentDay) return;
    try {
      await fetch(`/api/routines/${routineId}/days/${currentDay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      setRoutine((prev) => {
        if (!prev) return prev;
        const newDays = [...prev.days];
        if (newDays[selectedDayIndex]) {
          newDays[selectedDayIndex] = { ...newDays[selectedDayIndex], label };
        }
        return { ...prev, days: newDays };
      });
    } catch {
      setErrorMessage('Failed to update day focus.');
    }
  };

  // Add exercise to currently selected day
  const handleAddExercise = async (exerciseId: string) => {
    if (!currentDay) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/routines/${routineId}/days/${currentDay.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          defaultSets: 3,
          defaultReps: 10,
        }),
      });

      if (res.ok) {
        await fetchRoutine();
        setIsLibraryOpen(false);
        setSuccessMessage('Exercise added to day!');
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to add exercise.');
      }
    } catch {
      setErrorMessage('Failed to add exercise.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove exercise from day
  const handleRemoveExercise = async (exerciseItemId: string) => {
    if (!currentDay) return;
    try {
      const res = await fetch(
        `/api/routines/${routineId}/days/${currentDay.id}/exercises/${exerciseItemId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await fetchRoutine();
        setSuccessMessage('Exercise removed.');
      }
    } catch {
      setErrorMessage('Failed to remove exercise.');
    }
  };

  // Update exercise settings (sets, reps, weight, notes)
  const handleUpdateExerciseSettings = async (
    exerciseItemId: string,
    updates: { defaultSets?: number; defaultReps?: number; defaultWeightKg?: number; notes?: string }
  ) => {
    if (!currentDay) return;
    try {
      const res = await fetch(
        `/api/routines/${routineId}/days/${currentDay.id}/exercises/${exerciseItemId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );
      if (res.ok) {
        await fetchRoutine();
      }
    } catch {
      setErrorMessage('Failed to update exercise settings.');
    }
  };

  // Reorder exercises: move up / down
  const handleMoveExercise = async (index: number, direction: 'up' | 'down') => {
    if (!currentDay || currentDay.exercises.length <= 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentDay.exercises.length) return;

    const newExerciseList = [...currentDay.exercises];
    const targetItem = newExerciseList[index];
    const swapItem = newExerciseList[newIndex];
    if (!targetItem || !swapItem) return;

    newExerciseList[index] = swapItem;
    newExerciseList[newIndex] = targetItem;

    const exerciseIds = newExerciseList.map((e) => e.id);

    try {
      const res = await fetch(
        `/api/routines/${routineId}/days/${currentDay.id}/exercises/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseIds }),
        }
      );
      if (res.ok) {
        await fetchRoutine();
      }
    } catch {
      setErrorMessage('Failed to reorder exercises.');
    }
  };

  // Duplicate Routine
  const handleDuplicateRoutine = async () => {
    try {
      const res = await fetch(`/api/routines/${routineId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const cloned = await res.json();
        router.push(`/routines/${cloned.id}`);
      }
    } catch {
      setErrorMessage('Failed to duplicate routine.');
    }
  };

  // AI Optimization handler
  const handleRunAIOptimization = async () => {
    if (!currentDay || currentDay.exercises.length === 0) return;
    setIsAIOptimizing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineId,
          dayId: currentDay.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'AI optimization failed.');
      }
      const data = await res.json();
      setAiOptimizationResult(data);
      setIsAIOptimizeOpen(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate AI optimization.');
    } finally {
      setIsAIOptimizing(false);
    }
  };

  const handleApplyAIOptimization = async () => {
    if (!currentDay || !aiOptimizationResult) return;
    setIsSaving(true);
    try {
      const exerciseIds = aiOptimizationResult.orderedExercises.map((e) => e.exerciseId);
      const res = await fetch(
        `/api/routines/${routineId}/days/${currentDay.id}/exercises/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseIds }),
        }
      );
      if (!res.ok) {
        throw new Error('Failed to apply suggested sequence.');
      }
      await fetchRoutine();
      setIsAIOptimizeOpen(false);
      setSuccessMessage('AI suggested exercise order applied successfully!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to apply optimization.');
    } finally {
      setIsSaving(false);
    }
  };

  // AI Goal Split Advisor handler
  const handleRunGoalAdvisor = async () => {
    if (!currentDay) return;
    setIsGoalAdvisorLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayLabel: currentDay.label || currentDay.dayOfWeek,
          dayOfWeek: currentDay.dayOfWeek,
          routineId,
          dayId: currentDay.id,
          currentExercises: currentDay.exercises.map((e) => ({
            name: e.name,
            primaryMuscle: e.primaryMuscle,
            defaultSets: e.defaultSets,
            defaultReps: e.defaultReps,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'AI Goal Advisor failed.');
      }
      const data = await res.json();
      setGoalAdvisorResult(data);
      setIsGoalAdvisorOpen(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate goal recommendations.');
    } finally {
      setIsGoalAdvisorLoading(false);
    }
  };

  const handleAddExerciseFromGoalAdvisor = async (suggested: {
    name: string;
    primaryMuscle: string;
    targetSets: number;
    targetReps: number;
  }) => {
    if (!currentDay) return;
    try {
      let targetExId: string | null = null;
      const searchRes = await fetch(`/api/exercises?q=${encodeURIComponent(suggested.name)}`);
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const match = searchJson.exercises?.find(
          (e: { name: string }) => e.name.toLowerCase() === suggested.name.toLowerCase()
        );
        if (match) {
          targetExId = match.id;
        }
      }

      if (!targetExId) {
        const createRes = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: suggested.name,
            primaryMuscle: suggested.primaryMuscle,
            category: 'STRENGTH',
          }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          targetExId = created.id;
        }
      }

      if (targetExId) {
        await fetch(`/api/routines/${routineId}/days/${currentDay.id}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: targetExId,
            defaultSets: suggested.targetSets,
            defaultReps: suggested.targetReps,
          }),
        });
        await fetchRoutine();
        setSuccessMessage(`Added "${suggested.name}" to ${currentDay.dayOfWeek}!`);
      }
    } catch {
      setErrorMessage(`Failed to add suggested exercise "${suggested.name}".`);
    }
  };

  const handleCustomExerciseCreated = async (created: { id: string; name: string }) => {
    if (!currentDay) return;
    await handleAddExercise(created.id);
  };

  // Filtered exercises for the library modal
  const filteredLibraryExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch =
        !searchQuery ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.primaryMuscle && ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMuscle =
        !selectedMuscleFilter ||
        (ex.primaryMuscle &&
          ex.primaryMuscle.toLowerCase() === selectedMuscleFilter.toLowerCase());

      return matchesSearch && matchesMuscle;
    });
  }, [allExercises, searchQuery, selectedMuscleFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold">Routine not found</h2>
        <p className="text-sm text-muted-foreground">The requested routine could not be located.</p>
        <Link href="/workout">
          <Button variant="outline">Back to Workout Hub</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/workout">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            All Routines
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateRoutine}
            className="gap-1 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
          <Link href="/workout">
            <Button size="sm" className="font-semibold gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          </Link>
        </div>
      </div>

      {/* Routine Metadata Card */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Input
                defaultValue={routine.name}
                onBlur={(e) => handleUpdateRoutineInfo(e.target.value, routine.description || '')}
                className="text-xl font-bold border-transparent hover:border-input focus:border-input px-2 h-auto py-1"
                placeholder="Routine Name"
              />
              {routine.isActive && (
                <Badge variant="success" className="shrink-0">
                  Active
                </Badge>
              )}
            </div>
            <Input
              defaultValue={routine.description || ''}
              onBlur={(e) => handleUpdateRoutineInfo(routine.name, e.target.value)}
              className="text-xs text-muted-foreground border-transparent hover:border-input focus:border-input px-2 h-8"
              placeholder="Add optional notes or description..."
            />
          </div>
        </CardHeader>
      </Card>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
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

      {/* 7-Day Selector Tabs */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Weekly Schedule (Monday → Sunday)
        </Label>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {routine.days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const dayLetter = day.dayOfWeek.slice(0, 3);
            return (
              <button
                type="button"
                key={day.id}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground font-bold shadow-sm'
                    : day.isRestDay
                      ? 'border-border/40 bg-muted/40 text-muted-foreground hover:border-border'
                      : 'border-border bg-card text-card-foreground hover:bg-accent/40'
                }`}
              >
                <span className="text-xs">{dayLetter}</span>
                <span className="text-[10px] mt-0.5 opacity-80">
                  {day.isRestDay ? 'Rest' : `${day.exercises.length} ex`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Editor */}
      {currentDay && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold">
                    {currentDay.dayOfWeek.charAt(0) + currentDay.dayOfWeek.slice(1).toLowerCase()}
                  </CardTitle>
                  {currentDay.isRestDay ? (
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" />
                      Rest Day
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      {currentDay.label || 'Workout'}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1">
                  Configure focus muscles and planned exercise order.
                </CardDescription>
              </div>

              {/* Rest Day Switch Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={currentDay.isRestDay ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleRestDay(!currentDay.isRestDay)}
                  className="text-xs h-8 gap-1.5"
                >
                  <Moon className="h-3.5 w-3.5" />
                  {currentDay.isRestDay ? 'Rest Day Active' : 'Mark as Rest Day'}
                </Button>
              </div>
            </div>

            {/* Muscle Group Focus Editor */}
            {!currentDay.isRestDay && (
              <div className="pt-3 space-y-2">
                <Label htmlFor="dayLabel" className="text-xs font-medium text-muted-foreground">
                  Muscle Focus / Day Label
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="dayLabel"
                    defaultValue={currentDay.label || ''}
                    onBlur={(e) => handleUpdateDayLabel(e.target.value)}
                    placeholder="e.g. Chest & Triceps, Leg Day, Pull"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Quick Muscle Selector Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {MUSCLE_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleUpdateDayLabel(tag)}
                      className="px-2 py-0.5 rounded-full border border-border text-[11px] hover:bg-primary/10 hover:border-primary transition-colors text-muted-foreground hover:text-primary"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {currentDay.isRestDay ? (
              <div className="p-8 text-center space-y-2 text-muted-foreground">
                <Moon className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                <h3 className="font-semibold text-sm text-foreground">Scheduled Rest & Recovery</h3>
                <p className="text-xs max-w-sm mx-auto">
                  Muscles repair and grow during recovery periods. No exercises planned for this day.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRestDay(false)}
                  className="mt-2 text-xs"
                >
                  Switch to Workout Day
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight">
                    Planned Exercises ({currentDay.exercises.length})
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isGoalAdvisorLoading}
                      onClick={handleRunGoalAdvisor}
                      className="gap-1.5 text-xs h-8 border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                    >
                      {isGoalAdvisorLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      AI Goal Advisor
                    </Button>

                    {currentDay.exercises.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isAIOptimizing}
                        onClick={handleRunAIOptimization}
                        className="gap-1.5 text-xs h-8 font-semibold text-muted-foreground hover:text-foreground"
                      >
                        {isAIOptimizing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Target className="h-3.5 w-3.5" />
                        )}
                        Optimize Order
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={openExerciseLibrary}
                      className="gap-1 text-xs h-8 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Exercise
                    </Button>
                  </div>
                </div>

                {currentDay.exercises.length === 0 ? (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center space-y-2">
                    <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      No exercises added for this day yet.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openExerciseLibrary}
                        className="text-xs"
                      >
                        + Browse Exercise Library
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRunGoalAdvisor}
                        className="text-xs gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Suggest Exercises
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentDay.exercises.map((ex, index) => (
                      <div
                        key={ex.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/80 bg-card hover:border-border transition-colors gap-3"
                      >
                        {/* Order & Title */}
                        <div className="flex items-center gap-3">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveExercise(index, 'up')}
                              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
                              aria-label={`Move ${ex.name} up`}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === currentDay.exercises.length - 1}
                              onClick={() => handleMoveExercise(index, 'down')}
                              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
                              aria-label={`Move ${ex.name} down`}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-muted-foreground">
                                #{index + 1}
                              </span>
                              <span className="font-semibold text-sm text-foreground">{ex.name}</span>
                              {ex.primaryMuscle && (
                                <Badge variant="secondary" className="text-[10px] py-0">
                                  {ex.primaryMuscle}
                                </Badge>
                              )}
                            </div>

                            {/* Sets & Reps Inputs */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                              <div className="flex items-center gap-1">
                                <Label className="text-[11px]">Sets:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={20}
                                  defaultValue={ex.defaultSets}
                                  onBlur={(e) =>
                                    handleUpdateExerciseSettings(ex.id, {
                                      defaultSets: parseInt(e.target.value, 10) || 3,
                                    })
                                  }
                                  className="h-6 w-14 text-xs px-1 text-center"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <Label className="text-[11px]">Reps:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  defaultValue={ex.defaultReps}
                                  onBlur={(e) =>
                                    handleUpdateExerciseSettings(ex.id, {
                                      defaultReps: parseInt(e.target.value, 10) || 10,
                                    })
                                  }
                                  className="h-6 w-14 text-xs px-1 text-center"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <Label className="text-[11px]">Weight (kg):</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  defaultValue={ex.defaultWeightKg || ''}
                                  placeholder="Auto"
                                  onBlur={(e) =>
                                    handleUpdateExerciseSettings(ex.id, {
                                      defaultWeightKg: e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  className="h-6 w-16 text-xs px-1 text-center"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFormGuideExercise({
                                name: ex.name,
                                primaryMuscle: ex.primaryMuscle,
                                videoUrl: ex.videoUrl,
                                instructions: ex.instructions,
                              })
                            }
                            className="h-7 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/10"
                            aria-label={`Form guide for ${ex.name}`}
                          >
                            <Play className="h-2.5 w-2.5 fill-current text-red-500" />
                            Form
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExercise(ex.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Remove ${ex.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EXERCISE LIBRARY MODAL */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base">Select Exercise</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-3 border-b border-border/60 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bench press, squat, pull-up..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateCustomOpen(true)}
                  className="text-xs h-9 gap-1 shrink-0 font-semibold text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Custom
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedMuscleFilter(null)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    selectedMuscleFilter === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Biceps', 'Triceps', 'Abs'].map(
                  (m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() =>
                        setSelectedMuscleFilter(selectedMuscleFilter === m ? null : m)
                      }
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        selectedMuscleFilter === m
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Exercise List */}
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-border/40">
              {isLibraryLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">Loading exercises...</p>
                </div>
              ) : filteredLibraryExercises.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">No matching exercises found.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCreateCustomOpen(true)}
                    className="text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create &quot;{searchQuery}&quot; as Custom Exercise
                  </Button>
                </div>
              ) : (
                filteredLibraryExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between py-2.5 hover:bg-muted/30 px-2 rounded-md transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground">{ex.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {ex.category}
                        </Badge>
                        {ex.primaryMuscle && <span>• {ex.primaryMuscle}</span>}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleAddExercise(ex.id)}
                      className="text-xs h-7 gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Exercise Modal */}
      <CreateCustomExerciseModal
        isOpen={isCreateCustomOpen}
        onClose={() => setIsCreateCustomOpen(false)}
        onCreated={handleCustomExerciseCreated}
      />

      {/* Form Video Guide Modal */}
      {formGuideExercise && (
        <FormVideoGuideModal
          isOpen={Boolean(formGuideExercise)}
          onClose={() => setFormGuideExercise(null)}
          exerciseName={formGuideExercise.name}
          primaryMuscle={formGuideExercise.primaryMuscle}
          videoUrl={formGuideExercise.videoUrl}
          instructions={formGuideExercise.instructions}
        />
      )}

      {/* AI Goal Advisor Modal */}
      {currentDay && (
        <AIGoalAdvisorModal
          isOpen={isGoalAdvisorOpen}
          onClose={() => setIsGoalAdvisorOpen(false)}
          dayLabel={currentDay.label || `Day ${currentDay.dayOfWeek}`}
          dayOfWeek={currentDay.dayOfWeek}
          result={goalAdvisorResult}
          onAddExercise={handleAddExerciseFromGoalAdvisor}
        />
      )}

      {/* AI Optimization Review Diff Modal */}
      {currentDay && (
        <AIOptimizeModal
          isOpen={isAIOptimizeOpen}
          onClose={() => setIsAIOptimizeOpen(false)}
          dayLabel={currentDay.label || `Day ${currentDay.dayOfWeek}`}
          originalExercises={currentDay.exercises}
          result={aiOptimizationResult}
          onApply={handleApplyAIOptimization}
          isApplying={isSaving}
        />
      )}
    </div>
  );
}

export default function RoutineDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RoutineDetailContent />
    </Suspense>
  );
}
