'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Timer,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Dumbbell,
  Clock,
  Flag,
} from 'lucide-react';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';

interface SetItem {
  id: string;
  setNumber: number;
  targetReps: number | null;
  actualReps: number;
  weightKg: number;
  notes: string | null;
}

interface ExerciseLogItem {
  id: string;
  displayOrder: number;
  skipped: boolean;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    category: string;
    instructions?: string[];
    videoUrl?: string | null;
    muscles: { isPrimary: boolean; muscleGroup: { name: string } }[];
  };
  sets: SetItem[];
}

interface WorkoutSessionData {
  id: string;
  startedAt: string;
  status: string;
  routineDayId: string | null;
  exerciseLogs: ExerciseLogItem[];
}

function ExecuteWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineDayId = searchParams.get('routineDayId');

  const [session, setSession] = useState<WorkoutSessionData | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Guide Modal State
  const [showFormGuide, setShowFormGuide] = useState(false);

  // Workout Elapsed Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Rest Timer State
  const [restDuration, setRestDuration] = useState(0);
  const [isRestActive, setIsRestActive] = useState(false);

  // Form Inputs for Adding a Set
  const [newSetWeight, setNewSetWeight] = useState<string>('60');
  const [newSetReps, setNewSetReps] = useState<string>('10');
  const [isLoggingSet, setIsLoggingSet] = useState(false);

  // Confirmation Modals
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  // 1. Load active session or start a new one
  const initSession = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Check active in-progress session
      const activeRes = await fetch('/api/sessions/active');
      if (activeRes.ok) {
        const activeJson = await activeRes.json();
        if (activeJson.activeSession) {
          setSession(activeJson.activeSession);
          setIsLoading(false);
          return;
        }
      }

      // If no active session, start one
      const startRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineDayId: routineDayId || undefined }),
      });

      if (startRes.ok) {
        const newSession = await startRes.json();
        setSession(newSession);
      } else {
        const err = await startRes.json();
        setErrorMessage(err.message || 'Failed to start workout session.');
      }
    } catch {
      setErrorMessage('Network error while starting workout.');
    } finally {
      setIsLoading(false);
    }
  }, [routineDayId]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // 2. Workout Elapsed Timer Loop
  useEffect(() => {
    if (!session || isTimerPaused) return;

    const startTimestamp = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isTimerPaused]);

  // 3. Rest Timer Loop
  useEffect(() => {
    if (!isRestActive || restDuration <= 0) {
      setIsRestActive(false);
      return;
    }

    const interval = setInterval(() => {
      setRestDuration((prev) => {
        if (prev <= 1) {
          setIsRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestActive, restDuration]);

  const startRestTimer = (seconds: number) => {
    setRestDuration(seconds);
    setIsRestActive(true);
  };

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentExerciseLog = session?.exerciseLogs[currentExerciseIndex];

  // Complete / Log Set
  const handleLogSet = async () => {
    if (!session || !currentExerciseLog) return;

    const weight = parseFloat(newSetWeight) || 0;
    const reps = parseInt(newSetReps, 10) || 10;

    setIsLoggingSet(true);
    try {
      const idempotencyKey = `set_${session.id}_${currentExerciseLog.id}_${Date.now()}`;
      const res = await fetch(
        `/api/sessions/${session.id}/exercises/${currentExerciseLog.id}/sets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            actualReps: reps,
            weightKg: weight,
            idempotencyKey,
          }),
        }
      );

      if (res.ok) {
        const newSet = await res.json();
        setSession((prev) => {
          if (!prev) return prev;
          const updatedLogs = [...prev.exerciseLogs];
          const exLog = updatedLogs[currentExerciseIndex];
          if (exLog) {
            exLog.sets = [...exLog.sets, newSet];
          }
          return { ...prev, exerciseLogs: updatedLogs };
        });

        // Trigger automatic 60s rest timer
        startRestTimer(60);
      }
    } catch {
      setErrorMessage('Failed to record set.');
    } finally {
      setIsLoggingSet(false);
    }
  };

  // Remove Set
  const handleDeleteSet = async (setId: string) => {
    if (!session || !currentExerciseLog) return;
    try {
      const res = await fetch(`/api/sessions/${session.id}/sets/${setId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSession((prev) => {
          if (!prev) return prev;
          const updatedLogs = [...prev.exerciseLogs];
          const exLog = updatedLogs[currentExerciseIndex];
          if (exLog) {
            exLog.sets = exLog.sets
              .filter((s) => s.id !== setId)
              .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          }
          return { ...prev, exerciseLogs: updatedLogs };
        });
      }
    } catch {
      setErrorMessage('Failed to delete set.');
    }
  };

  // Finish Workout
  const handleFinishWorkout = async () => {
    if (!session) return;
    setIsFinishing(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSecs: elapsedSeconds }),
      });

      if (res.ok) {
        router.push('/history');
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to finish workout.');
        setIsFinishing(false);
        setShowFinishModal(false);
      }
    } catch {
      setErrorMessage('Network error finishing workout.');
      setIsFinishing(false);
    }
  };

  // Abandon Workout
  const handleAbandonWorkout = async () => {
    if (!session) return;
    try {
      await fetch(`/api/sessions/${session.id}/abandon`, { method: 'POST' });
      router.push('/workout');
    } catch {
      setErrorMessage('Failed to abandon workout.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.exerciseLogs.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/60" />
        <h2 className="text-xl font-bold">No Exercises in Session</h2>
        <p className="text-xs text-muted-foreground">
          No planned exercises were found for this session. Add exercises to your split first.
        </p>
        <Link href="/workout">
          <Button variant="outline" size="sm">
            Back to Workout Splits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card shadow-sm">
        {/* Workout Timer */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workout Time
            </div>
            <div className="text-lg font-black tracking-tight font-mono">
              {formatTimerDisplay(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsTimerPaused(!isTimerPaused)}
            className="h-8 w-8 p-0"
            aria-label={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isTimerPaused ? <Play className="h-4 w-4 text-emerald-500" /> : <Pause className="h-4 w-4" />}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAbandonModal(true)}
            className="text-xs h-8 text-muted-foreground hover:text-destructive"
          >
            Abandon
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowFinishModal(true)}
            className="font-bold text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Flag className="h-3.5 w-3.5" />
            Finish
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Interactive Rest Timer Banner */}
      {isRestActive && (
        <div className="p-3 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold">Resting:</span>
            <span className="text-base font-black font-mono text-primary">
              {formatTimerDisplay(restDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRestDuration((p) => p + 15)}
              className="text-[11px] h-7 px-2"
            >
              +15s
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRestActive(false)}
              className="text-[11px] h-7 px-2 text-muted-foreground"
            >
              Skip Rest
            </Button>
          </div>
        </div>
      )}

      {/* Exercise Stepper / Navigator */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
        <span>
          Exercise {currentExerciseIndex + 1} of {session.exerciseLogs.length}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex((i) => i - 1)}
            className="h-7 w-7 p-0"
            aria-label="Previous exercise"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentExerciseIndex === session.exerciseLogs.length - 1}
            onClick={() => setCurrentExerciseIndex((i) => i + 1)}
            className="h-7 w-7 p-0"
            aria-label="Next exercise"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Exercise Card */}
      {currentExerciseLog && (
        <Card className="border-border bg-card shadow-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-black text-foreground">
                    {currentExerciseLog.exercise.name}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {currentExerciseLog.exercise.category}
                  </Badge>
                  {currentExerciseLog.exercise.muscles[0] && (
                    <Badge variant="secondary" className="text-[10px]">
                      {currentExerciseLog.exercise.muscles[0].muscleGroup.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFormGuide(true)}
                  className="text-[11px] h-7 px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                >
                  <Play className="h-2.5 w-2.5 fill-current text-red-500" />
                  Form
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startRestTimer(60)}
                  className="text-[10px] h-7 px-2 gap-1 text-muted-foreground"
                >
                  <Clock className="h-3 w-3" />
                  60s
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startRestTimer(90)}
                  className="text-[10px] h-7 px-2 gap-1 text-muted-foreground"
                >
                  <Clock className="h-3 w-3" />
                  90s Rest
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Completed Sets Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground px-2">
                <div className="col-span-2">SET</div>
                <div className="col-span-4 text-center">WEIGHT (KG)</div>
                <div className="col-span-4 text-center">REPS</div>
                <div className="col-span-2 text-right">ACTION</div>
              </div>

              {currentExerciseLog.sets.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No sets logged yet. Enter your weight & reps below to log set 1.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentExerciseLog.sets.map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs font-semibold"
                    >
                      <div className="col-span-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>#{set.setNumber}</span>
                      </div>

                      <div className="col-span-4 text-center font-mono text-foreground">
                        {set.weightKg} kg
                      </div>

                      <div className="col-span-4 text-center font-mono text-foreground">
                        {set.actualReps} reps
                      </div>

                      <div className="col-span-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSet(set.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete set ${set.setNumber}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Set Logging Form */}
            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
              <div className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Log Set #{currentExerciseLog.sets.length + 1}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Auto-starts rest timer
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="setWeight" className="text-[11px] text-muted-foreground">
                    Weight (kg)
                  </Label>
                  <Input
                    id="setWeight"
                    type="number"
                    step="0.5"
                    value={newSetWeight}
                    onChange={(e) => setNewSetWeight(e.target.value)}
                    className="h-10 text-base font-bold text-center"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="setReps" className="text-[11px] text-muted-foreground">
                    Reps
                  </Label>
                  <Input
                    id="setReps"
                    type="number"
                    min={1}
                    max={100}
                    value={newSetReps}
                    onChange={(e) => setNewSetReps(e.target.value)}
                    className="h-10 text-base font-bold text-center"
                  />
                </div>
              </div>

              <Button
                type="button"
                disabled={isLoggingSet}
                onClick={handleLogSet}
                className="w-full font-bold h-10 gap-2 text-sm shadow-sm"
              >
                {isLoggingSet ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Set #{currentExerciseLog.sets.length + 1}
                  </>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3 pb-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentExerciseIndex === 0}
              onClick={() => setCurrentExerciseIndex((i) => i - 1)}
              className="text-xs h-8 gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev Exercise
            </Button>

            {currentExerciseIndex < session.exerciseLogs.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentExerciseIndex((i) => i + 1)}
                className="text-xs h-8 gap-1 font-semibold"
              >
                Next Exercise
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowFinishModal(true)}
                className="text-xs h-8 gap-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Flag className="h-3.5 w-3.5" />
                Finish Workout
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* FINISH WORKOUT CONFIRMATION MODAL */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <h3 className="font-bold text-lg">Finish Workout?</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Great work! We will save your completed sets, calculate total workout volume, and log
              duration ({formatTimerDisplay(elapsedSeconds)}).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isFinishing}
                onClick={() => setShowFinishModal(false)}
                className="text-xs"
              >
                Continue Training
              </Button>
              <Button
                size="sm"
                disabled={isFinishing}
                onClick={handleFinishWorkout}
                className="font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                {isFinishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm & Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ABANDON WORKOUT MODAL */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="font-bold text-lg">Abandon Workout?</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to cancel and abandon this workout session? Incomplete sessions will
              not be counted in your completed streak.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAbandonModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleAbandonWorkout}
                className="font-semibold text-xs"
              >
                Yes, Abandon
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Video Guide Modal */}
      {currentExerciseLog && (
        <FormVideoGuideModal
          isOpen={showFormGuide}
          onClose={() => setShowFormGuide(false)}
          exerciseName={currentExerciseLog.exercise.name}
          primaryMuscle={currentExerciseLog.exercise.muscles[0]?.muscleGroup.name}
          videoUrl={currentExerciseLog.exercise.videoUrl}
          instructions={currentExerciseLog.exercise.instructions}
        />
      )}
    </div>
  );
}

export default function ExecuteWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ExecuteWorkoutContent />
    </Suspense>
  );
}
