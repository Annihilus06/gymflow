'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnatomicalBody } from '@/components/dashboard/AnatomicalBody';
import { Dumbbell } from 'lucide-react';

export function MuscleWikiExplorer() {
  const router = useRouter();
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest');
  const [bodyView, setBodyView] = useState<'FRONT' | 'BACK'>('FRONT');

  const handleSelectMuscle = (muscleName: string) => {
    setSelectedMuscle(muscleName);
    router.push(`/exercises?muscle=${encodeURIComponent(muscleName)}`);
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
              Visual Map
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any body part to explore all target exercises and execution form videos.
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
            onSelectMuscle={handleSelectMuscle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
