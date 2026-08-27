'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnatomicalBody } from '@/components/dashboard/AnatomicalBody';
import { Dumbbell, ExternalLink } from 'lucide-react';

interface MuscleGroupOption {
  id: string;
  name: string;
  view: 'FRONT' | 'BACK' | 'BOTH';
  url: string;
}

const MUSCLE_GROUPS: MuscleGroupOption[] = [
  { id: 'Chest', name: 'Chest', view: 'FRONT', url: 'https://musclewiki.com/exercises/male/chest' },
  { id: 'Shoulders', name: 'Shoulders', view: 'FRONT', url: 'https://musclewiki.com/exercises/male/shoulders' },
  { id: 'Biceps', name: 'Biceps', view: 'FRONT', url: 'https://musclewiki.com/exercises/male/biceps' },
  { id: 'Abs', name: 'Abs / Core', view: 'FRONT', url: 'https://musclewiki.com/exercises/male/abdominals' },
  { id: 'Quads', name: 'Quadriceps', view: 'FRONT', url: 'https://musclewiki.com/exercises/male/quads' },
  { id: 'Back', name: 'Back & Lats', view: 'BACK', url: 'https://musclewiki.com/exercises/male/lats' },
  { id: 'Triceps', name: 'Triceps', view: 'BACK', url: 'https://musclewiki.com/exercises/male/triceps' },
  { id: 'Glutes', name: 'Glutes', view: 'BACK', url: 'https://musclewiki.com/exercises/male/glutes' },
  { id: 'Hamstrings', name: 'Hamstrings', view: 'BACK', url: 'https://musclewiki.com/exercises/male/hamstrings' },
  { id: 'Calves', name: 'Calves', view: 'BOTH', url: 'https://musclewiki.com/exercises/male/calves' },
  { id: 'Traps', name: 'Traps', view: 'BACK', url: 'https://musclewiki.com/exercises/male/traps' },
  { id: 'Forearms', name: 'Forearms', view: 'FRONT', url: 'https://musclewiki.com/exercises/male/forearms' },
];

const MUSCLE_WIKI_URLS: Record<string, string> = {
  Chest: 'https://musclewiki.com/exercises/male/chest',
  Shoulders: 'https://musclewiki.com/exercises/male/shoulders',
  Biceps: 'https://musclewiki.com/exercises/male/biceps',
  Triceps: 'https://musclewiki.com/exercises/male/triceps',
  Abs: 'https://musclewiki.com/exercises/male/abdominals',
  Quads: 'https://musclewiki.com/exercises/male/quads',
  Back: 'https://musclewiki.com/exercises/male/lats',
  Glutes: 'https://musclewiki.com/exercises/male/glutes',
  Hamstrings: 'https://musclewiki.com/exercises/male/hamstrings',
  Calves: 'https://musclewiki.com/exercises/male/calves',
  Traps: 'https://musclewiki.com/exercises/male/traps',
  Forearms: 'https://musclewiki.com/exercises/male/forearms',
};

export function MuscleWikiExplorer() {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest');
  const [bodyView, setBodyView] = useState<'FRONT' | 'BACK'>('FRONT');

  const openMuscleWiki = (muscleName: string) => {
    setSelectedMuscle(muscleName);
    const targetUrl = MUSCLE_WIKI_URLS[muscleName] ?? 'https://musclewiki.com/exercises';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

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
              Live Library
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any body part or muscle group to instantly view all possible exercises and proper form video guides.
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
          {/* Left: Interactive Vector Anatomical Body (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/60">
            <AnatomicalBody
              view={bodyView}
              selectedMuscle={selectedMuscle}
              onSelectMuscle={openMuscleWiki}
            />

            <div className="mt-3 text-center w-full">
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1">
                <span>Click any body part to explore on MuscleWiki</span>
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Right: Clean Muscle Chips (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Muscle to Open Exercises:
              </span>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((m) => {
                  const isSelected = selectedMuscle.toLowerCase() === m.id.toLowerCase();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => openMuscleWiki(m.id)}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.03]'
                          : 'border-border/80 bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground'
                      }`}
                    >
                      <span>{m.name}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
