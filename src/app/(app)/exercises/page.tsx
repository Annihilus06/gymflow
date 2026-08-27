'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Dumbbell,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
} from 'lucide-react';
import { MUSCLE_WIKI_DATABASE, type MuscleWikiExercise } from '@/data/musclewiki-exercises';
import { CreateCustomExerciseModal } from '@/components/exercises/CreateCustomExerciseModal';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';
import { GymFlowLoader } from '@/components/ui/GymFlowLoader';

const MUSCLE_TABS = [
  'All',
  'Chest',
  'Shoulders',
  'Back',
  'Biceps',
  'Triceps',
  'Abs',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
];

const EQUIPMENT_TABS = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

function ExercisesContent() {
  const searchParams = useSearchParams();
  const initialMuscle = searchParams.get('muscle') || 'All';

  const [selectedMuscle, setSelectedMuscle] = useState(initialMuscle);
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<{
    name: string;
    primaryMuscle?: string | null;
    videoUrl?: string | null;
    instructions?: string[];
  } | null>(null);

  // Sync URL parameter if it changes
  useEffect(() => {
    const urlMuscle = searchParams.get('muscle');
    if (urlMuscle && MUSCLE_TABS.some((m) => m.toLowerCase() === urlMuscle.toLowerCase())) {
      const match = MUSCLE_TABS.find((m) => m.toLowerCase() === urlMuscle.toLowerCase());
      if (match) setSelectedMuscle(match);
    }
  }, [searchParams]);

  // Combine all exercises from all muscle groups
  const allPossibleExercises = useMemo(() => {
    const allList: MuscleWikiExercise[] = [];
    Object.values(MUSCLE_WIKI_DATABASE).forEach((exercises) => {
      allList.push(...exercises);
    });
    return allList;
  }, []);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let list: MuscleWikiExercise[];

    if (selectedMuscle === 'All') {
      list = allPossibleExercises;
    } else {
      list = MUSCLE_WIKI_DATABASE[selectedMuscle] ?? [];
    }

    return list.filter((ex) => {
      const matchesEquipment =
        selectedEquipment === 'All' ||
        ex.equipment.toLowerCase() === selectedEquipment.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscle.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.secondaryMuscles?.some((m) => m.toLowerCase().includes(q));

      return matchesEquipment && matchesSearch;
    });
  }, [allPossibleExercises, selectedMuscle, selectedEquipment, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-primary" />
            Complete Exercise Library
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every movement possible across all muscle groups with proper form video guides.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="font-bold text-xs gap-2 shadow-sm shrink-0 h-9"
        >
          <Plus className="h-4 w-4" />
          Create Custom Exercise
        </Button>
      </div>

      {/* Muscle Group Filter Tabs */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Filter by Body Part:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_TABS.map((muscle) => {
            const isSelected = selectedMuscle.toLowerCase() === muscle.toLowerCase();
            const count =
              muscle === 'All'
                ? allPossibleExercises.length
                : (MUSCLE_WIKI_DATABASE[muscle] ?? []).length;

            return (
              <button
                type="button"
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]'
                    : 'border-border/80 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                <span>{muscle}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-black/20 text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Equipment Filter Strip */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises by name, muscle, or keyword (e.g. Bench Press, Squat, Cable)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 overflow-x-auto bg-card border border-border/70 p-1 rounded-xl">
          {EQUIPMENT_TABS.map((eq) => {
            const isActive = selectedEquipment === eq;
            return (
              <button
                key={eq}
                type="button"
                onClick={() => setSelectedEquipment(eq)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5 text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Showing {filteredExercises.length} {selectedMuscle === 'All' ? 'Total' : selectedMuscle} Exercises
        </span>
        {selectedEquipment !== 'All' && (
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            Equipment: {selectedEquipment}
          </Badge>
        )}
      </div>

      {/* Exercise Cards Grid */}
      {filteredExercises.length === 0 ? (
        <Card className="border-dashed border-border p-10 text-center bg-card/40 rounded-2xl">
          <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
          <CardTitle className="text-base font-black">No Matching Exercises</CardTitle>
          <CardDescription className="text-xs max-w-sm mx-auto mt-1">
            Try adjusting your search query or selecting &quot;All&quot; equipment.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredExercises.map((ex) => {
            const isExpanded = expandedExerciseId === ex.id;

            return (
              <Card
                key={ex.id}
                className="border-border/80 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between rounded-2xl shadow-sm overflow-hidden"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm sm:text-base font-black text-foreground">
                        {ex.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {ex.muscle}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold border-border/70">
                          {ex.equipment}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-primary border-primary/30 bg-primary/5"
                        >
                          {ex.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      <span className="text-[10px] text-muted-foreground font-semibold">Targets:</span>
                      {ex.secondaryMuscles.map((sec, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-muted/40 text-muted-foreground border border-border/40 font-medium"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                {/* Expanded Instructions & Technique Details */}
                {isExpanded && (
                  <CardContent className="p-4 pt-2 border-t border-border/50 space-y-2.5 text-xs bg-muted/10">
                    <div className="space-y-1.5">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        Proper Technique Cues:
                      </span>
                      <ol className="list-decimal pl-4 space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                        {ex.instructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                )}

                <CardFooter className="flex items-center justify-between border-t border-border/50 p-3 bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(ex.id)}
                      className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground font-semibold"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Hide Cues
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Technique Cues
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedGuideExercise({
                          name: ex.name,
                          primaryMuscle: ex.muscle,
                          videoUrl: null,
                          instructions: ex.instructions,
                        })
                      }
                      className="text-xs h-8 gap-1 text-primary border-primary/30 hover:bg-primary/10 font-bold"
                    >
                      <Play className="h-3 w-3 fill-current text-primary" />
                      Watch Form Video
                    </Button>
                  </div>

                  <Link href="/workout">
                    <Button size="sm" className="text-xs h-8 gap-1 font-bold">
                      <Plus className="h-3 w-3" />
                      Add to Split
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Custom Exercise Modal */}
      <CreateCustomExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {}}
      />

      {/* Form Video Guide Modal */}
      {selectedGuideExercise && (
        <FormVideoGuideModal
          isOpen={Boolean(selectedGuideExercise)}
          onClose={() => setSelectedGuideExercise(null)}
          exerciseName={selectedGuideExercise.name}
          primaryMuscle={selectedGuideExercise.primaryMuscle}
          videoUrl={selectedGuideExercise.videoUrl}
          instructions={selectedGuideExercise.instructions}
        />
      )}
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<GymFlowLoader sublabel="Loading complete exercise library..." />}>
      <ExercisesContent />
    </Suspense>
  );
}
