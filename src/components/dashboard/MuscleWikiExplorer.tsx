'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnatomicalBody } from '@/components/dashboard/AnatomicalBody';
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
  { id: 'Abs', name: 'Abs / Core', view: 'FRONT', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', description: 'Rectus Abdominis & Obliques' },
  { id: 'Quads', name: 'Quadriceps', view: 'FRONT', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', description: 'Front Thighs' },
  { id: 'Back', name: 'Back & Lats', view: 'BACK', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', description: 'Latissimus Dorsi & Traps' },
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

// Built-in baseline exercises mapped to anatomical muscles
const DEFAULT_MUSCLE_EXERCISES: Record<string, ExerciseItem[]> = {
  Chest: [
    { id: 'c1', name: 'Barbell Bench Press', category: 'Strength', primaryMuscle: 'Chest', equipment: 'Barbell', instructions: ['Retract shoulder blades', 'Lower bar to mid-chest with control', 'Drive up through palms'] },
    { id: 'c2', name: 'Incline Dumbbell Press', category: 'Hypertrophy', primaryMuscle: 'Chest', equipment: 'Dumbbells', instructions: ['Set bench to 30-45 degrees', 'Press dumbbells up and slightly inward', 'Control the stretch at the bottom'] },
    { id: 'c3', name: 'Cable Chest Fly', category: 'Isolation', primaryMuscle: 'Chest', equipment: 'Cable Machine', instructions: ['Slight bend in elbows', 'Bring handles together in front of chest', 'Squeeze pectorals at peak contraction'] },
    { id: 'c4', name: 'Dips (Chest Focus)', category: 'Bodyweight', primaryMuscle: 'Chest', equipment: 'Dip Station', instructions: ['Lean torso slightly forward', 'Lower until elbows reach 90 degrees', 'Press up firmly'] },
  ],
  Shoulders: [
    { id: 's1', name: 'Overhead Barbell Press', category: 'Strength', primaryMuscle: 'Shoulders', equipment: 'Barbell', instructions: ['Brace core and glutes', 'Press bar vertically overhead', 'Lock out with head moving forward through window'] },
    { id: 's2', name: 'Dumbbell Lateral Raise', category: 'Isolation', primaryMuscle: 'Shoulders', equipment: 'Dumbbells', instructions: ['Lead with elbows slightly forward in scapular plane', 'Raise to shoulder height', 'Control the 2-second negative'] },
    { id: 's3', name: 'Face Pulls', category: 'Rehab / Upper', primaryMuscle: 'Shoulders', equipment: 'Cable Machine', instructions: ['Pull rope to eye level', 'Externally rotate shoulders at finish', 'Squeeze rear delts'] },
  ],
  Back: [
    { id: 'b1', name: 'Barbell Deadlift', category: 'Strength', primaryMuscle: 'Back', equipment: 'Barbell', instructions: ['Hips back, flat spine', 'Drive through floor with mid-foot', 'Lock out hips and lats at top'] },
    { id: 'b2', name: 'Lat Pulldown', category: 'Hypertrophy', primaryMuscle: 'Back', equipment: 'Cable Machine', instructions: ['Grip slightly wider than shoulders', 'Pull bar to upper chest', 'Drive elbows down and back'] },
    { id: 'b3', name: 'Seated Cable Row', category: 'Hypertrophy', primaryMuscle: 'Back', equipment: 'Cable Machine', instructions: ['Keep torso upright', 'Pull handle to navel', 'Retract scapulae firmly'] },
  ],
  Biceps: [
    { id: 'bi1', name: 'Barbell Bicep Curl', category: 'Hypertrophy', primaryMuscle: 'Biceps', equipment: 'Barbell', instructions: ['Keep elbows pinned at sides', 'Curl bar up without swinging torso', 'Squeeze biceps at top'] },
    { id: 'bi2', name: 'Incline Dumbbell Curl', category: 'Isolation', primaryMuscle: 'Biceps', equipment: 'Dumbbells', instructions: ['Sit back on 45-degree incline', 'Full stretch at bottom', 'Supinate wrists as you curl up'] },
    { id: 'bi3', name: 'Hammer Curls', category: 'Hypertrophy', primaryMuscle: 'Biceps', equipment: 'Dumbbells', instructions: ['Neutral palms facing inward', 'Curl up emphasizing brachialis', 'Control the descent'] },
  ],
  Triceps: [
    { id: 't1', name: 'Tricep Rope Pushdown', category: 'Isolation', primaryMuscle: 'Triceps', equipment: 'Cable Machine', instructions: ['Keep upper arms stationary', 'Extend elbows fully downwards', 'Spread rope apart at bottom'] },
    { id: 't2', name: 'Skull Crushers (EZ Bar)', category: 'Hypertrophy', primaryMuscle: 'Triceps', equipment: 'EZ Bar', instructions: ['Lower bar towards forehead or crown', 'Keep elbows pointed upwards', 'Extend elbows to lock out'] },
    { id: 't3', name: 'Overhead Tricep Extension', category: 'Hypertrophy', primaryMuscle: 'Triceps', equipment: 'Dumbbell', instructions: ['Press dumbbell overhead', 'Lower behind neck stretching long head', 'Press back up to lockout'] },
  ],
  Abs: [
    { id: 'a1', name: 'Hanging Leg Raise', category: 'Core', primaryMuscle: 'Abs', equipment: 'Pull-up Bar', instructions: ['Hang from bar with overhand grip', 'Raise legs towards chest without excessive swing', 'Lower with control'] },
    { id: 'a2', name: 'Cable Woodchopper', category: 'Core / Obliques', primaryMuscle: 'Abs', equipment: 'Cable Machine', instructions: ['Rotate torso across body using obliques', 'Keep arms extended', 'Slowly return to start'] },
    { id: 'a3', name: 'Plank Hold', category: 'Endurance', primaryMuscle: 'Abs', equipment: 'Bodyweight', instructions: ['Forearms on floor, glutes squeezed', 'Maintain neutral spine from head to heels', 'Hold for target duration'] },
  ],
  Quads: [
    { id: 'q1', name: 'Barbell Back Squat', category: 'Strength', primaryMuscle: 'Quads', equipment: 'Barbell', instructions: ['Feet shoulder-width apart', 'Descend until hip crease is below parallel', 'Drive through mid-foot to stand'] },
    { id: 'q2', name: 'Leg Press', category: 'Hypertrophy', primaryMuscle: 'Quads', equipment: 'Leg Press Machine', instructions: ['Feet shoulder-width on platform', 'Lower platform to 90 degrees knee flexion', 'Press up without locking knees abruptly'] },
    { id: 'q3', name: 'Leg Extension', category: 'Isolation', primaryMuscle: 'Quads', equipment: 'Machine', instructions: ['Extend legs fully upwards', 'Pause for 1 second at top contraction', 'Lower with 2-second negative'] },
  ],
  Hamstrings: [
    { id: 'h1', name: 'Romanian Deadlift (RDL)', category: 'Strength', primaryMuscle: 'Hamstrings', equipment: 'Barbell', instructions: ['Hinge at hips with soft knees', 'Lower bar along shins feeling deep stretch', 'Contract glutes and hamstrings to return'] },
    { id: 'h2', name: 'Lying Leg Curl', category: 'Isolation', primaryMuscle: 'Hamstrings', equipment: 'Machine', instructions: ['Curl pad towards glutes', 'Keep hips flat on bench', 'Lower slowly resisting the weight'] },
  ],
  Glutes: [
    { id: 'g1', name: 'Barbell Hip Thrust', category: 'Hypertrophy', primaryMuscle: 'Glutes', equipment: 'Barbell', instructions: ['Upper back supported against bench', 'Drive hips upward into full extension', 'Squeeze glutes hard at top'] },
    { id: 'g2', name: 'Bulgarian Split Squat', category: 'Unilateral', primaryMuscle: 'Glutes', equipment: 'Dumbbells', instructions: ['Rear foot elevated on bench', 'Descend until front thigh is parallel', 'Drive through front heel'] },
  ],
  Calves: [
    { id: 'cal1', name: 'Standing Calf Raise', category: 'Isolation', primaryMuscle: 'Calves', equipment: 'Machine', instructions: ['Elevate balls of feet on platform', 'Lower heels for full stretch', 'Drive up on toes and hold peak contraction'] },
    { id: 'cal2', name: 'Seated Calf Raise', category: 'Isolation', primaryMuscle: 'Calves', equipment: 'Machine', instructions: ['Sit with knees bent 90 degrees', 'Lower heels deep below platform', 'Raise high targeting soleus'] },
  ],
};

export function MuscleWikiExplorer() {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest');
  const [bodyView, setBodyView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [exercises, setExercises] = useState<ExerciseItem[]>(DEFAULT_MUSCLE_EXERCISES['Chest'] ?? []);
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

  const handleSelectMuscle = (muscle: string) => {
    setSelectedMuscle(muscle);
    const config = MUSCLE_GROUPS.find((m) => m.id.toLowerCase() === muscle.toLowerCase());
    if (config && config.view !== 'BOTH') {
      setBodyView(config.view);
    }
  };

  useEffect(() => {
    async function loadExercises() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/exercises?muscleGroup=${encodeURIComponent(selectedMuscle)}`);
        if (res.ok) {
          const json = await res.json();
          const items: ExerciseItem[] = Array.isArray(json) ? json : json.items ?? [];
          if (items.length > 0) {
            setExercises(items);
            return;
          }
        }
      } catch {
        // Use default static fallback
      } finally {
        setIsLoading(false);
      }

      // Fallback to built-in exercises for this muscle
      const fallback = DEFAULT_MUSCLE_EXERCISES[selectedMuscle] ?? DEFAULT_MUSCLE_EXERCISES['Chest'] ?? [];
      setExercises(fallback);
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
    MUSCLE_GROUPS.find((m) => m.id.toLowerCase() === selectedMuscle.toLowerCase()) ?? DEFAULT_MUSCLE_CONFIG;

  const exerciseList = Array.isArray(exercises) ? exercises : [];

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card shadow-sm rounded-2xl">
      {/* Header Strip */}
      <div className="p-4 sm:p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h3 className="text-base font-black text-foreground">Interactive Muscle Wiki</h3>
            <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/30">
              Visual Guide
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any body part to explore target exercises and watch execution form videos.
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
            Front Body
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
            Back Body
          </button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-6">
        <div className="grid gap-6 lg:grid-cols-12 items-center">
          {/* Left: Generated Vector Anatomical Body Map */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/60">
            <AnatomicalBody
              view={bodyView}
              selectedMuscle={selectedMuscle}
              onSelectMuscle={handleSelectMuscle}
            />

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

          {/* Right: Muscle Group Chips & Exercise List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Muscle Selector Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Muscle Groups:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS.map((m) => {
                  const isSelected = selectedMuscle.toLowerCase() === m.id.toLowerCase();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMuscle(m.id)}
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

            {/* Targeted Exercises & Form Videos */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Exercises for {activeMuscleConfig.name} ({exerciseList.length})
                </span>
              </div>

              {isLoading ? (
                <div className="flex min-h-[160px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : exerciseList.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No exercises found for {activeMuscleConfig.name}.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 max-h-[280px] overflow-y-auto pr-1">
                  {exerciseList.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex flex-col justify-between p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-2.5 shadow-sm"
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
