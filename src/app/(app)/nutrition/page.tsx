'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Utensils,
  Flame,
  Activity,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { DailyNutritionProgress } from '@/lib/services/nutrition.service';

export default function NutritionPage() {
  const [data, setData] = useState<DailyNutritionProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    name: '',
    estimatedCalories: 500,
    estimatedProteinG: 30,
    notes: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDailyNutrition = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nutrition/daily');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      setErrorMessage('Failed to load daily nutrition data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyNutrition();
  }, [fetchDailyNutrition]);

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mealForm.name,
          estimatedCalories: Number(mealForm.estimatedCalories),
          estimatedProteinG: Number(mealForm.estimatedProteinG),
          notes: mealForm.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to log meal.');
      }

      setMealForm({ name: '', estimatedCalories: 500, estimatedProteinG: 30, notes: '' });
      setIsModalOpen(false);
      await fetchDailyNutrition();
      setSuccessMessage('Meal logged successfully!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to log meal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const res = await fetch(`/api/nutrition/meals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDailyNutrition();
      }
    } catch {
      setErrorMessage('Failed to delete meal.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const targets = data?.targets;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <Utensils className="h-7 w-7 text-primary" />
            Nutrition & Fuel
          </h1>
          <p className="text-sm text-muted-foreground">
            Track daily calories, macronutrient targets, and meal logs.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 font-semibold text-xs h-9"
        >
          <Plus className="h-4 w-4" />
          Log Meal
        </Button>
      </div>

      {/* Medical Disclaimer Alert */}
      <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Info className="h-4 w-4 text-primary" />
          <span>Scientific Nutrition Estimate Disclaimer</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {targets?.disclaimer.notice ||
            'Calculations are mathematical estimates based on sports nutrition formulas (Mifflin-St Jeor & WHO standards) and do not constitute medical diagnosis or prescriptions.'}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Target & Progress Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Calories Progress Card */}
        <Card className="bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">Daily Calories</CardDescription>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">
              {data?.consumedCalories ?? 0}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                / {targets?.dailyCalorieTarget ?? 0} kcal
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <Progress value={data?.calorieProgressPct ?? 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{data?.calorieProgressPct ?? 0}% consumed</span>
              <span className="font-semibold text-foreground">
                {data?.remainingCalories ?? 0} kcal remaining
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Protein Progress Card */}
        <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">Daily Protein</CardDescription>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">
              {data?.consumedProteinG ?? 0}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                / {targets?.dailyProteinTargetG ?? 0} g
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <Progress value={data?.proteinProgressPct ?? 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{data?.proteinProgressPct ?? 0}% target met</span>
              <span className="font-semibold text-foreground">
                {data?.remainingProteinG ?? 0} g remaining
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Breakdown & Metabolic Overview */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Metabolic Overview & Formulas</CardTitle>
          <CardDescription className="text-xs">
            Derived deterministically from your biometric profile.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg border border-border/80 bg-muted/10 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">BMR</span>
              <span className="block text-base font-bold text-foreground">{targets?.bmr ?? '--'} kcal</span>
              <span className="text-[9px] text-muted-foreground block">Mifflin-St Jeor</span>
            </div>

            <div className="p-2.5 rounded-lg border border-border/80 bg-muted/10 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">TDEE</span>
              <span className="block text-base font-bold text-foreground">{targets?.tdee ?? '--'} kcal</span>
              <span className="text-[9px] text-muted-foreground block">Maintenance level</span>
            </div>

            <div className="p-2.5 rounded-lg border border-border/80 bg-muted/10 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">BMI</span>
              <span className="block text-base font-bold text-primary">{targets?.bmi ?? '--'}</span>
              <Badge variant="success" className="text-[9px] py-0">
                {targets?.bmiCategory || 'Normal'}
              </Badge>
            </div>

            <div className="p-2.5 rounded-lg border border-border/80 bg-muted/10 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Daily Goal</span>
              <span className="block text-base font-bold text-orange-500">
                {targets?.dailyCalorieTarget ?? '--'} kcal
              </span>
              <span className="text-[9px] text-muted-foreground block">Goal-adjusted target</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Logged Meals */}
      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Today&apos;s Logged Meals ({data?.meals.length || 0})
        </h2>

        {data?.meals.length === 0 ? (
          <Card className="border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground space-y-2">
            <p>No meals logged yet today.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Your First Meal
            </Button>
          </Card>
        ) : (
          <div className="grid gap-2">
            {data?.meals.map((m) => (
              <Card key={m.id} className="border-border/80 bg-card p-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-foreground block text-sm">{m.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {m.estimatedCalories} kcal • {m.estimatedProteinG} g protein
                    {m.notes ? ` • ${m.notes}` : ''}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMeal(m.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Meal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                Log Meal Intake
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogMeal} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="mealName">Meal Name</Label>
                <Input
                  id="mealName"
                  required
                  placeholder="e.g. Chicken Rice Bowl, Whey Shake"
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="calories">Estimated Calories (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    required
                    min={0}
                    value={mealForm.estimatedCalories}
                    onChange={(e) =>
                      setMealForm({ ...mealForm, estimatedCalories: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="protein">Estimated Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    required
                    min={0}
                    value={mealForm.estimatedProteinG}
                    onChange={(e) =>
                      setMealForm({ ...mealForm, estimatedProteinG: parseFloat(e.target.value) || 0 })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mealNotes">Notes (Optional)</Label>
                <Input
                  id="mealNotes"
                  placeholder="e.g. Post-workout lunch"
                  value={mealForm.notes}
                  onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="text-xs h-8 font-semibold"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Log Meal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
