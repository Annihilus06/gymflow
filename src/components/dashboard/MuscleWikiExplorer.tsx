'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';
import { Dumbbell, Play, Sparkles, Loader2 } from 'lucide-react';

interface MuscleGroupOption {
  id: string;
  name: string;
  view: 'FRONT' | 'BACK' | 'BOTH';
  color: string;
  description: string;
}

const MUSCLE_GROUPS: MuscleGroupOption[] = [
  { id: 'Chest', name: 'Chest', view: 'FRONT', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', description: 'Pectoralis Major & Minor' },
  { id: 'Shoulders', name: 'Shoulders', view: 'FRONT', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', description: 'Anterior & Lateral Delts' },
  { id: 'Biceps', name: 'Biceps', view: 'FRONT', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', description: 'Biceps Brachii' },
  { id: 'Abs', name: 'Abs / Core', view: 'FRONT', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', description: 'Rectus Abdominis' },
  { id: 'Quads', name: 'Quadriceps', view: 'FRONT', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', description: 'Front Thighs' },
  { id: 'Back', name: 'Back / Lats', view: 'BACK', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', description: 'Latissimus Dorsi & Traps' },
  { id: 'Triceps', name: 'Triceps', view: 'BACK', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', description: 'Triceps Brachii' },
  { id: 'Glutes', name: 'Glutes', view: 'BACK', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30', description: 'Gluteus Maximus' },
  { id: 'Hamstrings', name: 'Hamstrings', view: 'BACK', color: 'bg-red-500/10 text-red-400 border-red-500/30', description: 'Posterior Thighs' },
  { id: 'Calves', name: 'Calves', view: 'BOTH', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', description: 'Gastrocnemius & Soleus' },
];

interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment?: string | null;
  videoUrl?: string | null;
  instructions?: string[];
}

export function MuscleWikiExplorer() {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest');
  const [bodyView, setBodyView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoModalData, setVideoModalData] = useState<{
    isOpen: boolean;
    exerciseName: string;
    primaryMuscle: string;
    videoUrl?: string | null;
    instructions?: string[];
  }>({
    isOpen: false,
    exerciseName: '',
    primaryMuscle: '',
  });

  useEffect(() => {
    async function loadExercises() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/exercises?muscle=${encodeURIComponent(selectedMuscle)}`);
        if (res.ok) {
          const data = await res.json();
          setExercises(data);
        } else {
          // Fallback exercises if none in filter
          const allRes = await fetch('/api/exercises');
          if (allRes.ok) {
            const allData: ExerciseItem[] = await allRes.json();
            const filtered = allData.filter((e) =>
              e.primaryMuscle?.toLowerCase().includes(selectedMuscle.toLowerCase()) ||
              e.name.toLowerCase().includes(selectedMuscle.toLowerCase())
            );
            setExercises(filtered.length > 0 ? filtered : allData.slice(0, 4));
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadExercises();
  }, [selectedMuscle]);

  const DEFAULT_MUSCLE_CONFIG: MuscleGroupOption = {
    id: 'Chest',
    name: 'Chest',
    view: 'FRONT',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Pectoralis Major & Minor',
  };

  const activeMuscleConfig: MuscleGroupOption =
    MUSCLE_GROUPS.find((m) => m.id === selectedMuscle) ?? DEFAULT_MUSCLE_CONFIG;

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h3 className="text-base font-black text-foreground">Interactive Muscle Wiki</h3>
            <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30">
              Form Guides & Videos
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a muscle group to view target exercises and watch execution video guides.
          </p>
        </div>

        {/* Front / Back Toggle */}
        <div className="flex rounded-xl border border-border p-1 bg-background text-xs font-bold w-fit">
          <button
            type="button"
            onClick={() => setBodyView('FRONT')}
            className={`px-3 py-1 rounded-lg transition-all ${
              bodyView === 'FRONT'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => setBodyView('BACK')}
            className={`px-3 py-1 rounded-lg transition-all ${
              bodyView === 'BACK'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Back View
          </button>
        </div>
      </div>

      <CardContent className="p-5 space-y-6">
        {/* Anatomical Body Explorer Grid */}
        <div className="grid gap-6 lg:grid-cols-12 items-center">
          {/* Left: Anatomical Body Visual */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/60 relative">
            <div className="relative w-full max-w-[220px] aspect-[1/1.5] rounded-xl overflow-hidden flex items-center justify-center">
              <Image
                src={bodyView === 'FRONT' ? '/images/body/front.png' : '/images/body/back.png'}
                alt={`${bodyView} anatomical muscle map`}
                fill
                className="object-contain drop-shadow-md"
                priority
              />
            </div>

            <div className="mt-3 text-center">
              <Badge
                variant="outline"
                className={`text-xs font-black px-3 py-1 border ${activeMuscleConfig.color}`}
              >
                Target: {activeMuscleConfig.name}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1">{activeMuscleConfig.description}</p>
            </div>
          </div>

          {/* Right: Quick Muscle Picker & Exercise List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Muscle Selector Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Muscle Focus:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS.map((m) => {
                  const isSelected = selectedMuscle === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMuscle(m.id);
                        if (m.view !== 'BOTH') setBodyView(m.view);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.03]'
                          : 'border-border/80 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercises List for Target Muscle */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Exercises for {activeMuscleConfig.name} ({exercises.length})
                </span>
              </div>

              {isLoading ? (
                <div className="flex min-h-[160px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : exercises.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No exercises found for {activeMuscleConfig.name}.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 max-h-[280px] overflow-y-auto pr-1">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex flex-col justify-between p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs text-foreground line-clamp-1">
                            {ex.name}
                          </span>
                          <Badge variant="secondary" className="text-[9px] py-0 px-1 shrink-0">
                            {ex.category || 'Strength'}
                          </Badge>
                        </div>
                        {ex.equipment && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Equipment: {ex.equipment}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setVideoModalData({
                            isOpen: true,
                            exerciseName: ex.name,
                            primaryMuscle: ex.primaryMuscle || activeMuscleConfig.name,
                            videoUrl: ex.videoUrl,
                            instructions: ex.instructions,
                          })
                        }
                        className="w-full text-xs font-bold h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Play className="h-3 w-3 fill-current text-primary" />
                        Watch Form Video
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Form Video Guide Modal */}
      <FormVideoGuideModal
        isOpen={videoModalData.isOpen}
        onClose={() => setVideoModalData((prev) => ({ ...prev, isOpen: false }))}
        exerciseName={videoModalData.exerciseName}
        primaryMuscle={videoModalData.primaryMuscle}
        videoUrl={videoModalData.videoUrl}
        instructions={videoModalData.instructions}
      />
    </Card>
  );
}
