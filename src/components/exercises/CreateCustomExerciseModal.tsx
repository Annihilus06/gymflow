'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Plus,
  Dumbbell,
  Loader2,
  AlertCircle,
  Video,
  CheckCircle,
} from 'lucide-react';

const COMMON_PRIMARY_MUSCLES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Abs',
  'Glutes',
  'Calves',
  'Forearms',
  'Full Body',
];

interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (createdExercise: {
    id: string;
    name: string;
    category: string;
    primaryMuscle: string | null;
    instructions: string[];
    videoUrl?: string | null;
  }) => void;
}

export function CreateCustomExerciseModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCustomExerciseModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'PLYOMETRICS'>('STRENGTH');
  const [primaryMuscle, setPrimaryMuscle] = useState('Chest');
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSecondaryMuscle = (muscle: string) => {
    if (secondaryMuscles.includes(muscle)) {
      setSecondaryMuscles(secondaryMuscles.filter((m) => m !== muscle));
    } else {
      setSecondaryMuscles([...secondaryMuscles, muscle]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter an exercise name.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const instructions = instructionText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          primaryMuscle,
          secondaryMuscles,
          description: description.trim() || undefined,
          instructions: instructions.length > 0 ? instructions : undefined,
          videoUrl: videoUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create custom exercise.');
      }

      const created = await res.json();
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating custom exercise.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Create Custom Exercise</h3>
              <p className="text-xs text-muted-foreground">Add your personalized movement to your library</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Exercise Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-name" className="text-xs font-semibold text-foreground">
              Exercise Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ex-name"
              placeholder="e.g. Incline Dumbbell Curl, Dumbbell Shoulder Press..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
              required
              autoFocus
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Category</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'PLYOMETRICS'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 rounded-md border text-[11px] font-semibold transition-colors ${
                    category === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Muscle Group */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Primary Muscle Focus <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRIMARY_MUSCLES.map((muscle) => (
                <button
                  type="button"
                  key={muscle}
                  onClick={() => setPrimaryMuscle(muscle)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    primaryMuscle === muscle
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Muscle Groups (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Secondary Muscles (Optional)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRIMARY_MUSCLES.filter((m) => m !== primaryMuscle).map((muscle) => {
                const isSelected = secondaryMuscles.includes(muscle);
                return (
                  <button
                    type="button"
                    key={muscle}
                    onClick={() => handleToggleSecondaryMuscle(muscle)}
                    className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                      isSelected
                        ? 'bg-secondary text-secondary-foreground border-primary font-semibold'
                        : 'border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isSelected ? `✓ ${muscle}` : `+ ${muscle}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Execution Instructions / Steps */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-instructions" className="text-xs font-semibold text-foreground">
              Instructions & Technique Cues (1 step per line)
            </Label>
            <textarea
              id="ex-instructions"
              rows={3}
              placeholder={`1. Lie back with neutral spine\n2. Lower dumbbells under control\n3. Press back up without locking elbows`}
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Custom Video / YouTube Link */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-video" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-primary" />
              YouTube Video URL (Optional)
            </Label>
            <Input
              id="ex-video"
              placeholder="https://www.youtube.com/watch?v=... (or auto-searches correct form)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Leave blank to automatically search and embed high-definition YouTube form tutorials for this exercise.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !name.trim()}
              className="text-xs h-9 gap-1.5 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Create Exercise
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
