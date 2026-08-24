'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Clock,
  Dumbbell,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  PlusCircle,
  Scale,
  CheckCircle2,
} from 'lucide-react';

interface SetItem {
  id: string;
  setNumber: number;
  actualReps: number;
  weightKg: number;
}

interface ExerciseLogItem {
  id: string;
  displayOrder: number;
  skipped: boolean;
  exercise: {
    id: string;
    name: string;
    category: string;
    muscles: { isPrimary: boolean; muscleGroup: { name: string } }[];
  };
  sets: SetItem[];
}

interface CompletedSession {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  durationSecs: number | null;
  totalVolumeKg: number | null;
  notes: string | null;
  exerciseLogs: ExerciseLogItem[];
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        setErrorMessage('Failed to load workout history.');
      }
    } catch {
      setErrorMessage('Network error loading history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this workout log?')) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      setErrorMessage('Failed to delete workout session.');
    }
  };

  const formatDuration = (secs: number | null) => {
    if (!secs) return '< 1m';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workout History</h1>
          <p className="text-sm text-muted-foreground">
            Review completed workout logs, volume lifted, and exercise execution records.
          </p>
        </div>

        <Link href="/execute">
          <Button className="font-semibold gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            Start Workout
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {sessions.length === 0 ? (
        <Card className="border-dashed border-border/80 p-8 text-center bg-card/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <History className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">No Completed Workouts</CardTitle>
          <CardDescription className="max-w-sm mx-auto mt-1 mb-4">
            You haven&apos;t completed any workouts yet. Start your first workout to record your sets and volume.
          </CardDescription>
          <Link href="/execute">
            <Button className="font-semibold gap-2">
              <PlusCircle className="h-4 w-4" />
              Start First Workout
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedSessionIds.has(session.id);
            const startDate = new Date(session.startedAt);
            const totalSets = session.exerciseLogs.reduce(
              (sum, ex) => sum + (ex.skipped ? 0 : ex.sets.length),
              0
            );

            return (
              <Card key={session.id} className="border-border/80 bg-card shadow-sm transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                        <CardTitle className="text-base font-bold">
                          {startDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </CardTitle>
                      </div>

                      <CardDescription className="text-xs mt-1">
                        Started at{' '}
                        {startDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </CardDescription>
                    </div>

                    {/* Stat Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {formatDuration(session.durationSecs)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-md">
                        <Scale className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-foreground">
                          {session.totalVolumeKg?.toLocaleString() || 0} kg
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-md">
                        <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {session.exerciseLogs.length} exercises ({totalSets} sets)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Collapsible Exercise Details */}
                {isExpanded && (
                  <CardContent className="pt-2 border-t border-border/50 space-y-3">
                    <div className="space-y-3 pt-2">
                      {session.exerciseLogs.map((exLog, i) => (
                        <div
                          key={exLog.id}
                          className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {i + 1}. {exLog.exercise.name}
                              </span>
                              {exLog.exercise.muscles[0] && (
                                <Badge variant="secondary" className="text-[10px] py-0">
                                  {exLog.exercise.muscles[0].muscleGroup.name}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {exLog.sets.length} sets completed
                            </span>
                          </div>

                          {/* Sets list */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {exLog.sets.map((set) => (
                              <div
                                key={set.id}
                                className="px-2 py-1 rounded border border-border/80 bg-card text-[11px] font-mono"
                              >
                                Set {set.setNumber}: {set.weightKg}kg × {set.actualReps}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                <CardFooter className="flex items-center justify-between border-t border-border/50 pt-2 pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(session.id)}
                    className="text-xs h-8 gap-1 text-muted-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        View Exercise Breakdown
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Delete workout session log"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete Log
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
