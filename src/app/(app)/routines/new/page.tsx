'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoutineSchema, type CreateRoutineInput } from '@/lib/validations/routine.schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    name: 'Push / Pull / Legs (PPL)',
    description: 'Classic 6-day hypertrophy split targeting pushing, pulling, and leg muscles.',
    days: [
      { dayOfWeek: 'MONDAY' as const, label: 'Push (Chest, Shoulders, Triceps)', isRestDay: false },
      { dayOfWeek: 'TUESDAY' as const, label: 'Pull (Back & Biceps)', isRestDay: false },
      { dayOfWeek: 'WEDNESDAY' as const, label: 'Legs & Calves', isRestDay: false },
      { dayOfWeek: 'THURSDAY' as const, label: 'Push (Chest & Delts)', isRestDay: false },
      { dayOfWeek: 'FRIDAY' as const, label: 'Pull (Lats & Traps)', isRestDay: false },
      { dayOfWeek: 'SATURDAY' as const, label: 'Legs & Core', isRestDay: false },
      { dayOfWeek: 'SUNDAY' as const, label: 'Rest & Recovery', isRestDay: true },
    ],
  },
  {
    name: 'Upper / Lower Split',
    description: 'Balanced 4-day strength and muscle building routine with ample recovery.',
    days: [
      { dayOfWeek: 'MONDAY' as const, label: 'Upper Body A', isRestDay: false },
      { dayOfWeek: 'TUESDAY' as const, label: 'Lower Body A', isRestDay: false },
      { dayOfWeek: 'WEDNESDAY' as const, label: 'Rest Day', isRestDay: true },
      { dayOfWeek: 'THURSDAY' as const, label: 'Upper Body B', isRestDay: false },
      { dayOfWeek: 'FRIDAY' as const, label: 'Lower Body B', isRestDay: false },
      { dayOfWeek: 'SATURDAY' as const, label: 'Rest Day', isRestDay: true },
      { dayOfWeek: 'SUNDAY' as const, label: 'Rest Day', isRestDay: true },
    ],
  },
  {
    name: 'Classic Bodybuilding Split',
    description: 'Targeted single or double muscle group workouts across the week.',
    days: [
      { dayOfWeek: 'MONDAY' as const, label: 'Chest', isRestDay: false },
      { dayOfWeek: 'TUESDAY' as const, label: 'Back', isRestDay: false },
      { dayOfWeek: 'WEDNESDAY' as const, label: 'Rest', isRestDay: true },
      { dayOfWeek: 'THURSDAY' as const, label: 'Shoulders', isRestDay: false },
      { dayOfWeek: 'FRIDAY' as const, label: 'Legs', isRestDay: false },
      { dayOfWeek: 'SATURDAY' as const, label: 'Arms', isRestDay: false },
      { dayOfWeek: 'SUNDAY' as const, label: 'Rest', isRestDay: true },
    ],
  },
];

export default function NewRoutinePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateRoutineInput>({
    resolver: zodResolver(createRoutineSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      days: [],
    },
  });

  const applyTemplate = (index: number) => {
    const template = PRESET_TEMPLATES[index];
    if (!template) return;
    setSelectedTemplateIndex(index);
    setValue('name', template.name);
    setValue('description', template.description);
    setValue(
      'days',
      template.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        isRestDay: d.isRestDay,
        exercises: [],
      }))
    );
  };

  const onSubmit = async (data: CreateRoutineInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.message || 'Failed to create routine.');
        setIsLoading(false);
        return;
      }

      router.push(`/routines/${json.id}`);
    } catch {
      setErrorMessage('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/workout">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Routines
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Routine</h1>
        <p className="text-sm text-muted-foreground">
          Define your planned weekly workout schedule and assign training days.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Templates */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Start with a popular template (Optional)</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              type="button"
              key={tmpl.name}
              onClick={() => applyTemplate(idx)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                selectedTemplateIndex === idx
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-accent/50'
              }`}
            >
              <span className="font-semibold text-xs text-foreground line-clamp-1">{tmpl.name}</span>
              <span className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                {tmpl.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Routine Info Form */}
      <Card className="border-border/80 bg-card shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-lg">Routine Details</CardTitle>
            <CardDescription>
              Give your routine a name. You can customize exercises for each day on the next screen.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Routine Name</Label>
              <Input
                id="name"
                placeholder="e.g. 5-Day Hypertrophy Split"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g. Focus on progressive overload and bench strength"
                {...register('description')}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                {...register('isActive')}
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Set as my active weekly routine immediately
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-border/50 pt-4">
            <Button type="submit" disabled={isLoading} className="font-semibold gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Split...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Continue to Day & Exercise Builder
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
