'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  X,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Loader2,
  Activity,
  Flame,
} from 'lucide-react';
import type { WorkoutOptimizationOutput } from '@/lib/validations/ai.schema';

interface OriginalExerciseItem {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string | null;
}

interface AIOptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayLabel: string;
  originalExercises: OriginalExerciseItem[];
  result: WorkoutOptimizationOutput | null;
  onApply: () => Promise<void>;
  isApplying: boolean;
}

export function AIOptimizeModal({
  isOpen,
  onClose,
  dayLabel,
  originalExercises,
  result,
  onApply,
  isApplying,
}: AIOptimizeModalProps) {
  if (!isOpen || !result) return null;

  // Map suggested exercise IDs to exercise names
  const exerciseMap = new Map(originalExercises.map((e) => [e.id, e]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">AI Workout Optimization</h2>
              <p className="text-xs text-muted-foreground">
                Biomechanical analysis and ordering review for {dayLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Summary Banner */}
          {result.reasoningSummary && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-foreground space-y-1">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Advisor Rationale
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {result.reasoningSummary}
              </p>
            </div>
          )}

          {/* Warnings Section */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Volume & Balance Alerts ({result.warnings.length})
              </h3>
              <div className="space-y-1.5">
                {result.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[11px] space-y-1"
                  >
                    <div className="font-semibold text-amber-500 flex items-center justify-between">
                      <span>{w.type.replace('_', ' ')}</span>
                      {w.affectedMuscles && w.affectedMuscles.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {w.affectedMuscles.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{w.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diff View: Original vs Suggested Order */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Exercise Sequencing Diff
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Original Column */}
              <div className="space-y-1.5 border border-border/60 rounded-lg p-2.5 bg-muted/10">
                <span className="font-semibold text-[11px] text-muted-foreground block pb-1 border-b border-border/40">
                  Current Planned Order
                </span>
                {originalExercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between py-1 px-1.5 rounded bg-card/60 border border-border/40 text-[11px]"
                  >
                    <span className="truncate">
                      <strong className="text-muted-foreground mr-1.5">#{idx + 1}</strong>
                      {ex.name}
                    </span>
                    {ex.primaryMuscle && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1">
                        {ex.primaryMuscle}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* AI Suggested Column */}
              <div className="space-y-1.5 border border-primary/30 rounded-lg p-2.5 bg-primary/5">
                <span className="font-semibold text-[11px] text-primary block pb-1 border-b border-primary/20">
                  AI Recommended Sequence
                </span>
                {result.orderedExercises.map((rec, idx) => {
                  const ex = exerciseMap.get(rec.exerciseId);
                  return (
                    <div
                      key={rec.exerciseId}
                      className="py-1 px-1.5 rounded bg-card border border-primary/20 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate text-foreground">
                          <strong className="text-primary mr-1.5">#{idx + 1}</strong>
                          {ex ? ex.name : rec.exerciseId}
                        </span>
                        {ex?.primaryMuscle && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1">
                            {ex.primaryMuscle}
                          </Badge>
                        )}
                      </div>
                      {rec.rationale && (
                        <p className="text-[10px] text-muted-foreground italic truncate">
                          {rec.rationale}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recommendations List */}
          {result.recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-primary" />
                Strategic Recommendations
              </h3>
              <div className="space-y-1.5">
                {result.recommendations.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-border/80 bg-card text-[11px] space-y-0.5"
                  >
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {r.title}
                    </span>
                    <p className="text-muted-foreground pl-4.5">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Explicit User Confirmation */}
        <div className="p-3 border-t border-border flex items-center justify-between bg-muted/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 text-muted-foreground"
          >
            Discard
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isApplying}
            onClick={onApply}
            className="gap-1.5 text-xs h-8 font-semibold shadow-sm"
          >
            {isApplying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            Apply AI Suggested Order
          </Button>
        </div>
      </div>
    </div>
  );
}
