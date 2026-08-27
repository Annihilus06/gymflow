'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnatomicalBody } from '@/components/dashboard/AnatomicalBody';
import { MUSCLE_WIKI_DATABASE } from '@/data/musclewiki-exercises';
import { Dumbbell, ChevronRight, Sparkles } from 'lucide-react';

interface MuscleGroupOption {
  id: string;
  name: string;
  view: 'FRONT' | 'BACK' | 'BOTH';
  color: string;
  description: string;
}

const MUSCLE_GROUPS: MuscleGroupOption[] = [
  { id: 'Chest', name: 'Chest', view: 'FRONT', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', description: 'Pectoralis Major & Minor (Clavicular & Sternal)' },
  { id: 'Shoulders', name: 'Shoulders', view: 'FRONT', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', description: 'Anterior, Lateral & Posterior Deltoids' },
  { id: 'Biceps', name: 'Biceps', view: 'FRONT', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', description: 'Biceps Brachii (Long & Short Head) & Brachialis' },
  { id: 'Abs', name: 'Abs / Core', view: 'FRONT', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', description: 'Rectus Abdominis, Obliques & Deep Core' },
  { id: 'Quads', name: 'Quadriceps', view: 'FRONT', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', description: 'Front Thighs & Knee Extensors' },
  { id: 'Back', name: 'Back & Lats', view: 'BACK', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', description: 'Latissimus Dorsi, Rhomboids, Traps & Lower Back' },
  { id: 'Triceps', name: 'Triceps', view: 'BACK', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', description: 'Lateral, Long & Medial Triceps Heads' },
  { id: 'Glutes', name: 'Glutes', view: 'BACK', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30', description: 'Gluteus Maximus, Medius & Minimus' },
  { id: 'Hamstrings', name: 'Hamstrings', view: 'BACK', color: 'bg-red-500/10 text-red-400 border-red-500/30', description: 'Posterior Thighs & Knee Flexors' },
  { id: 'Calves', name: 'Calves', view: 'BOTH', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', description: 'Gastrocnemius & Soleus' },
];

export function MuscleWikiExplorer() {
  const router = useRouter();
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest');
  const [bodyView, setBodyView] = useState<'FRONT' | 'BACK'>('FRONT');

  const handleSelectMuscle = (muscle: string) => {
    setSelectedMuscle(muscle);
    const config = MUSCLE_GROUPS.find((m) => m.id.toLowerCase() === muscle.toLowerCase());
    if (config && config.view !== 'BOTH') {
      setBodyView(config.view);
    }
  };

  const DEFAULT_MUSCLE_CONFIG: MuscleGroupOption = {
    id: 'Chest',
    name: 'Chest',
    view: 'FRONT',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Pectoralis Major & Minor',
  };

  const activeMuscleConfig: MuscleGroupOption =
    MUSCLE_GROUPS.find((m) => m.id.toLowerCase() === selectedMuscle.toLowerCase()) ?? DEFAULT_MUSCLE_CONFIG;

  const exerciseCount = (MUSCLE_WIKI_DATABASE[selectedMuscle] ?? MUSCLE_WIKI_DATABASE['Chest'] ?? []).length;

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
            Click any body part or muscle group below to open its full library of possible exercises and video form guides.
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

      <CardContent className="p-5 sm:p-6">
        <div className="grid gap-6 md:grid-cols-12 items-center">
          {/* Left: Anatomical Body (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/60">
            <AnatomicalBody
              view={bodyView}
              selectedMuscle={selectedMuscle}
              onSelectMuscle={(m) => {
                handleSelectMuscle(m);
                router.push(`/exercises?muscle=${encodeURIComponent(m)}`);
              }}
            />

            <div className="mt-3 text-center w-full">
              <Badge
                variant="outline"
                className={`text-xs font-black px-3 py-1 border ${activeMuscleConfig.color}`}
              >
                Target: {activeMuscleConfig.name}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                {activeMuscleConfig.description}
              </p>
            </div>
          </div>

          {/* Right: Muscle Group Buttons & Big CTA (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Muscle Group:
              </span>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((m) => {
                  const isSelected = selectedMuscle.toLowerCase() === m.id.toLowerCase();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMuscle(m.id)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
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

            {/* Prominent Action Card to open all exercises for this muscle */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    All {activeMuscleConfig.name} Exercises
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exerciseCount} possible exercises with video form tutorials, equipment filters & cues.
                  </p>
                </div>
              </div>

              <Link
                href={`/exercises?muscle=${encodeURIComponent(selectedMuscle)}`}
                className="block w-full"
              >
                <Button className="w-full font-black text-xs h-10 gap-2 shadow-lg shadow-primary/20">
                  <span>View All {activeMuscleConfig.name} Exercises & Videos</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
