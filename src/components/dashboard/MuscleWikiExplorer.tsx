'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnatomicalBody } from '@/components/dashboard/AnatomicalBody';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';
import { MUSCLE_WIKI_DATABASE, type MuscleWikiExercise } from '@/data/musclewiki-exercises';
import { Dumbbell, Play, Sparkles, Search } from 'lucide-react';

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
  { id: 'Quads', name: 'Quadriceps', view: 'FRONT', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', description: 'Rectus Femoris, Vastus Lateralis & Medialis' },
  { id: 'Back', name: 'Back & Lats', view: 'BACK', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', description: 'Latissimus Dorsi, Rhomboids, Trapezius & Erector Spinae' },
  { id: 'Triceps', name: 'Triceps', view: 'BACK', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', description: 'Triceps Brachii (Lateral, Long & Medial Heads)' },
  { id: 'Glutes', name: 'Glutes', view: 'BACK', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30', description: 'Gluteus Maximus, Medius & Minimus' },
  { id: 'Hamstrings', name: 'Hamstrings', view: 'BACK', color: 'bg-red-500/10 text-red-400 border-red-500/30', description: 'Biceps Femoris, Semitendinosus & Semimembranosus' },
  { id: 'Calves', name: 'Calves', view: 'BOTH', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', description: 'Gastrocnemius & Soleus' },
];

const EQUIPMENT_FILTERS = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'] as const;

export function MuscleWikiExplorer() {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Chest');
  const [bodyView, setBodyView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const DEFAULT_MUSCLE_CONFIG: MuscleGroupOption = {
    id: 'Chest',
    name: 'Chest',
    view: 'FRONT',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Pectoralis Major & Minor',
  };

  const activeMuscleConfig: MuscleGroupOption =
    MUSCLE_GROUPS.find((m) => m.id.toLowerCase() === selectedMuscle.toLowerCase()) ?? DEFAULT_MUSCLE_CONFIG;

  // Filter exercises for active muscle group by equipment and search term
  const filteredExercises = useMemo(() => {
    const muscleList: MuscleWikiExercise[] =
      MUSCLE_WIKI_DATABASE[selectedMuscle] ?? MUSCLE_WIKI_DATABASE['Chest'] ?? [];

    return muscleList.filter((ex) => {
      const matchesEquipment =
        selectedEquipment === 'All' ||
        ex.equipment.toLowerCase() === selectedEquipment.toLowerCase();

      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.secondaryMuscles?.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesEquipment && matchesSearch;
    });
  }, [selectedMuscle, selectedEquipment, searchQuery]);

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
              Exercise Library
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any body part on the anatomical map to explore all target exercises and watch execution form videos.
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
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Generated Vector Anatomical Body Map (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/60 sticky top-4">
            <AnatomicalBody
              view={bodyView}
              selectedMuscle={selectedMuscle}
              onSelectMuscle={handleSelectMuscle}
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

          {/* Right: Equipment Filter Bar, Search & Full Exercise Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Muscle Selector Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Target Muscle:
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

            {/* Equipment Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${activeMuscleConfig.name} exercises...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Equipment Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
                {EQUIPMENT_FILTERS.map((eq) => {
                  const isActive = selectedEquipment === eq;
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => setSelectedEquipment(eq)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary border-primary/40'
                          : 'bg-muted/30 text-muted-foreground border-transparent hover:text-foreground'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Targeted Exercises & Form Videos */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  All Exercises for {activeMuscleConfig.name} ({filteredExercises.length})
                </span>
                {selectedEquipment !== 'All' && (
                  <Badge variant="secondary" className="text-[10px] py-0">
                    Filtered: {selectedEquipment}
                  </Badge>
                )}
              </div>

              {filteredExercises.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No exercises match your filter. Try selecting &quot;All&quot; equipment or clearing the search.
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all space-y-3 shadow-sm group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-black text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {ex.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-bold py-0 px-1.5 shrink-0"
                          >
                            {ex.equipment}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="font-semibold text-primary/90">{ex.category}</span>
                          <span>•</span>
                          <span>{ex.difficulty}</span>
                        </div>

                        {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {ex.secondaryMuscles.slice(0, 2).map((sec, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-muted/40 text-muted-foreground border border-border/40"
                              >
                                {sec}
                              </span>
                            ))}
                          </div>
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
                            primaryMuscle: ex.muscle,
                            videoUrl: null,
                            instructions: ex.instructions,
                          })
                        }
                        className="w-full text-xs font-black h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary shadow-sm"
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
