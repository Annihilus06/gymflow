'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Sparkles,
  Target,
  CheckCircle,
  Plus,
  Play,
  Loader2,
  Dumbbell,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import type { AIGoalSuggestionOutput } from '@/lib/validations/ai.schema';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';

interface AIGoalAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayLabel: string;
  dayOfWeek?: string;
  result: AIGoalSuggestionOutput | null;
  onAddExercise: (exercise: {
    name: string;
    primaryMuscle: string;
    targetSets: number;
    targetReps: number;
  }) => Promise<void>;
}

export function AIGoalAdvisorModal({
  isOpen,
  onClose,
  dayLabel,
  dayOfWeek,
  result,
  onAddExercise,
}: AIGoalAdvisorModalProps) {
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedSet, setAddedSet] = useState<Set<number>>(new Set());
  const [guideExercise, setGuideExercise] = useState<{
    name: string;
    primaryMuscle: string;
  } | null>(null);

  if (!isOpen || !result) return null;

  const handleAdd = async (
    ex: {
      name: string;
      primaryMuscle: string;
      targetSets: number;
      targetReps: string;
    },
    index: number
  ) => {
    setAddingIndex(index);
    try {
      // Parse numeric rep if possible (e.g., "8-12 reps" -> 10)
      const repMatch = ex.targetReps.match(/\d+/);
      const repNum = repMatch ? parseInt(repMatch[0], 10) : 10;

      await onAddExercise({
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        targetSets: ex.targetSets || 3,
        targetReps: repNum,
      });

      setAddedSet((prev) => new Set(prev).add(index));
    } catch {
      // Handle error in parent
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  AI Goal & Split Advisor
                </h3>
                <Badge variant="default" className="text-[10px] bg-primary text-primary-foreground font-bold">
                  {dayOfWeek || 'Custom Day'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Optimal programming for <strong className="text-foreground">{dayLabel}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Goal Analysis Banner */}
          <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-primary text-sm">
              <Target className="h-4 w-4" />
              <span>Goal Analysis & Programming Strategy</span>
            </div>
            <p className="text-foreground/90 leading-relaxed text-xs">{result.goalAnalysis}</p>
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-semibold text-muted-foreground">Target Rep Scheme:</span>
              <Badge variant="secondary" className="text-[11px] font-bold">
                {result.suggestedRepRangeForGoal}
              </Badge>
            </div>
          </div>

          {/* Split Assessment */}
          <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Split Balance Assessment
            </span>
            <p className="text-muted-foreground leading-relaxed">{result.splitAssessment}</p>
          </div>

          {/* Recommended Movements */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-primary" />
                AI Recommended Exercises ({result.recommendedExercises.length})
              </span>
              <span className="text-[11px] text-muted-foreground italic">
                Tap &apos;+ Add&apos; to include in your day
              </span>
            </div>

            <div className="space-y-2">
              {result.recommendedExercises.map((ex, idx) => {
                const isAdded = addedSet.has(idx);
                const isAdding = addingIndex === idx;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card hover:border-border/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{ex.name}</span>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {ex.primaryMuscle}
                        </Badge>
                        <span className="text-[11px] font-semibold text-primary">
                          {ex.targetSets} sets × {ex.targetReps}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {ex.rationale}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setGuideExercise({
                            name: ex.name,
                            primaryMuscle: ex.primaryMuscle,
                          })
                        }
                        className="text-xs h-8 gap-1 border-border/80 text-muted-foreground hover:text-foreground"
                      >
                        <Play className="h-3 w-3 fill-current text-red-500" />
                        Form
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isAdded || isAdding}
                        onClick={() => handleAdd(ex, idx)}
                        className={`text-xs h-8 gap-1 font-semibold ${
                          isAdded ? 'bg-emerald-600 text-white' : ''
                        }`}
                      >
                        {isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isAdded ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Add to Day
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery & Form Tips */}
          {result.formAndRecoveryTips && result.formAndRecoveryTips.length > 0 && (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/10 space-y-1.5">
              <span className="font-semibold text-foreground text-xs">
                Key Performance & Recovery Guidelines:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                {result.formAndRecoveryTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-end">
          <Button size="sm" onClick={onClose} className="text-xs font-semibold px-4 h-8">
            Done
          </Button>
        </div>
      </div>

      {/* Embedded Form Guide Modal if clicked */}
      {guideExercise && (
        <FormVideoGuideModal
          isOpen={Boolean(guideExercise)}
          onClose={() => setGuideExercise(null)}
          exerciseName={guideExercise.name}
          primaryMuscle={guideExercise.primaryMuscle}
        />
      )}
    </div>
  );
}
