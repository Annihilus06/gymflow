'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Dumbbell,
  BookOpen,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  Play,
  Sparkles,
} from 'lucide-react';
import type { NormalizedExercise } from '@/lib/exercise-api/normalizer';
import { CreateCustomExerciseModal } from '@/components/exercises/CreateCustomExerciseModal';
import { FormVideoGuideModal } from '@/components/exercises/FormVideoGuideModal';

const MUSCLE_FILTER_CHIPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Biceps',
  'Triceps',
  'Abs',
];

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [exercises, setExercises] = useState<NormalizedExercise[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<{
    name: string;
    primaryMuscle?: string | null;
    videoUrl?: string | null;
    instructions?: string[];
  } | null>(null);

  const fetchExercises = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      if (query.trim()) {
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setExercises(json.results || []);
          setMatchStatus(json.matchStatus);
          setAttribution(json.results[0]?.attribution || null);
        }
      } else {
        const res = await fetch('/api/exercises');
        if (res.ok) {
          const json = await res.json();
          setExercises(
            json.exercises.map((e: { id: string; name: string; description: string | null; instructions: string[]; category: string; primaryMuscle: string | null; muscles: { name: string; isPrimary: boolean }[]; imageUrl: string | null; videoUrl: string | null; isCustom?: boolean }) => ({
              externalId: e.id,
              name: e.name,
              description: e.description,
              instructions: e.instructions,
              category: e.category,
              equipment: e.isCustom ? 'Custom' : 'Standard',
              difficulty: 'INTERMEDIATE',
              imageUrl: e.imageUrl,
              videoUrl: e.videoUrl,
              isCustom: e.isCustom,
              primaryMuscles: e.primaryMuscle ? [e.primaryMuscle] : ['Full Body'],
              secondaryMuscles: e.muscles.filter((m) => !m.isPrimary).map((m) => m.name),
              attribution: e.isCustom ? 'User Custom Exercise' : 'GymFlow Standard Exercise Catalogue',
              confidenceScore: 1.0,
            }))
          );
          setMatchStatus(null);
          setAttribution(null);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  };

  const handleCustomExerciseCreated = () => {
    fetchExercises(searchQuery);
  };

  const filteredExercises = exercises.filter((ex) => {
    if (selectedMuscle === 'All') return true;
    return ex.primaryMuscles.some((m) => m.toLowerCase() === selectedMuscle.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Exercise Library</h1>
          <p className="text-sm text-muted-foreground">
            Explore movement mechanics, target muscle groups, instructions, and video demos.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="font-semibold gap-2 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Custom Exercise
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises by name (e.g. Bench Press, Squat, Lat Pulldown)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        {/* Muscle Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_FILTER_CHIPS.map((muscle) => (
            <button
              type="button"
              key={muscle}
              onClick={() => setSelectedMuscle(muscle)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedMuscle === muscle
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>
      </div>

      {/* Match Status Banner */}
      {searchQuery.trim() && matchStatus && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 border border-border p-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span>
              Search match quality: <strong className="text-foreground">{matchStatus.replace('_', ' ')}</strong>
            </span>
          </div>

          {attribution && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {attribution}
            </span>
          )}
        </div>
      )}

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <Card className="border-dashed border-border p-8 text-center bg-card/40">
          <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
          <CardTitle className="text-base">No Matching Exercises Found</CardTitle>
          <CardDescription className="text-xs max-w-sm mx-auto mt-1">
            Try adjusting your search query or muscle filter.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredExercises.map((ex) => {
            const isExpanded = expandedExerciseId === ex.externalId;

            return (
              <Card
                key={ex.externalId}
                className="border-border/80 bg-card hover:border-border transition-colors flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {ex.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {ex.primaryMuscles[0] || 'Full Body'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {ex.equipment}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {ex.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {ex.description && (
                    <CardDescription className="text-xs pt-1.5 line-clamp-2">
                      {ex.description}
                    </CardDescription>
                  )}
                </CardHeader>

                {/* Expanded Instructions & Details */}
                {isExpanded && (
                  <CardContent className="pt-2 border-t border-border/50 space-y-3 text-xs">
                    {ex.secondaryMuscles.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground">Secondary Muscles:</span>
                        <div className="flex flex-wrap gap-1">
                          {ex.secondaryMuscles.map((m) => (
                            <span key={m} className="px-2 py-0.5 rounded bg-muted/40 text-[10px]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        Execution Instructions
                      </span>
                      <ol className="list-decimal pl-4 space-y-1 text-muted-foreground text-[11px]">
                        {ex.instructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {ex.attribution && (
                      <p className="text-[10px] text-muted-foreground pt-1 italic">
                        {ex.attribution}
                      </p>
                    )}
                  </CardContent>
                )}

                <CardFooter className="flex items-center justify-between border-t border-border/50 pt-2 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(ex.externalId)}
                      className="text-xs h-8 gap-1 text-muted-foreground"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Steps
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
                          primaryMuscle: ex.primaryMuscles[0] ?? null,
                          videoUrl: ex.videoUrl,
                          instructions: ex.instructions,
                        })
                      }
                      className="text-xs h-8 gap-1 text-primary border-primary/30 hover:bg-primary/10 font-medium"
                    >
                      <Play className="h-3 w-3 fill-current text-red-500" />
                      Form & Video
                    </Button>
                  </div>

                  <Link href="/workout">
                    <Button size="sm" className="text-xs h-8 gap-1 font-semibold">
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
        onCreated={handleCustomExerciseCreated}
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
