'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnatomicalBody } from '@/components/dashboard/AnatomicalBody';
import { Dumbbell, ExternalLink } from 'lucide-react';

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
              Live Map
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any body part to explore all exercises and form guides on MuscleWiki.
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

      <CardContent className="p-6 flex flex-col items-center justify-center">
        {/* Centered Interactive Vector Anatomical Body */}
        <div className="w-full max-w-sm flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/20 border border-border/60">
          <AnatomicalBody
            view={bodyView}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={openMuscleWiki}
          />

          <div className="mt-4 text-center">
            <span className="text-xs text-primary font-bold flex items-center justify-center gap-1.5 bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
              <span>Click any muscle to open MuscleWiki</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
