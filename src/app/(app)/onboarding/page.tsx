'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/profile.schema';
import { calculateBMI, getBMICategory } from '@/lib/utils/bmi';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BMISpectrumGauge } from '@/components/ui/visual/BMISpectrumGauge';
import {
  User,
  Scale,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Flame,
  Zap,
  TrendingUp,
  Dumbbell,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '2000-01-01',
      sex: 'MALE',
      heightCm: 175,
      currentWeightKg: 75,
      targetWeightKg: 70,
      weightUnit: 'KG',
      activityLevel: 'MODERATELY_ACTIVE',
      experienceLevel: 'BEGINNER',
      fitnessGoal: 'WEIGHT_LOSS',
      notificationsEnabled: false,
    },
    mode: 'onChange',
  });

  const currentHeight = watch('heightCm');
  const currentWeight = watch('currentWeightKg');
  const selectedSex = watch('sex');
  const selectedGoal = watch('fitnessGoal');

  // Compute live BMI preview in UI
  const previewBmi = useMemo(() => {
    if (currentHeight && currentWeight) {
      return calculateBMI(Number(currentWeight), Number(currentHeight));
    }
    return null;
  }, [currentHeight, currentWeight]);

  const bmiCategory = useMemo(() => {
    return previewBmi !== null ? getBMICategory(previewBmi) : null;
  }, [previewBmi]);

  const nextStep = async () => {
    setErrorMessage(null);
    let valid = false;

    if (step === 1) {
      valid = await trigger(['name', 'dateOfBirth', 'sex']);
    } else if (step === 2) {
      valid = await trigger(['heightCm', 'currentWeightKg', 'targetWeightKg', 'weightUnit']);
    }

    if (valid) {
      setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    }
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const onSubmit = async (data: OnboardingInput) => {
    if (step < 3) {
      await nextStep();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/profile/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.message || 'Failed to complete profile setup. Please try again.');
        setIsLoading(false);
        return;
      }

      await update?.({ onboardingComplete: true });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const progressPercentage = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="mx-auto max-w-lg space-y-5 animate-in fade-in duration-200">
      {/* Onboarding Visual Step Dials */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-8 bg-primary shadow-sm'
                  : step > s
                  ? 'w-3 bg-primary/40'
                  : 'w-3 bg-muted'
              }`}
            />
          ))}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {step === 1 ? 'Personal Info' : step === 2 ? 'Body Metrics' : 'Your Goal'}
        </h1>
        <p className="text-xs text-muted-foreground">
          {step === 1
            ? 'Tell us your details for metabolic calculations'
            : step === 2
            ? 'We compute your live BMI and daily targets'
            : 'Select your training focus and activity level'}
        </p>
      </div>

      <Card className="border-border/80 bg-card shadow-lg">
        <form
          onSubmit={(e) => {
            if (step < 3) {
              e.preventDefault();
              nextStep();
              return;
            }
            handleSubmit(onSubmit)(e);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && step < 3) {
              e.preventDefault();
              nextStep();
            }
          }}
        >
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-5 w-5" />
                  <CardTitle className="text-lg font-bold">Profile Basics</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Alex"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth" className="text-xs font-semibold">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className={errors.dateOfBirth ? 'border-destructive' : ''}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Biological Sex</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['MALE', 'FEMALE', 'OTHER'] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          const event = { target: { value: s, name: 'sex' } };
                          register('sex').onChange(event);
                        }}
                        className={`flex h-11 items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                          selectedSex === s
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                            : 'border-input hover:bg-muted/40'
                        }`}
                      >
                        {s === 'MALE' ? 'Male' : s === 'FEMALE' ? 'Female' : 'Other'}
                      </button>
                    ))}
                  </div>
                  {errors.sex && (
                    <p className="text-xs text-destructive">{errors.sex.message}</p>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: Body Metrics */}
          {step === 2 && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Scale className="h-5 w-5" />
                  <CardTitle className="text-lg font-bold">Body Metrics</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="heightCm" className="text-xs font-semibold">Height (cm)</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      placeholder="175"
                      {...register('heightCm', { valueAsNumber: true })}
                      className={errors.heightCm ? 'border-destructive' : ''}
                    />
                    {errors.heightCm && (
                      <p className="text-xs text-destructive">{errors.heightCm.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currentWeightKg" className="text-xs font-semibold">Weight (kg)</Label>
                    <Input
                      id="currentWeightKg"
                      type="number"
                      step="0.1"
                      placeholder="75"
                      {...register('currentWeightKg', { valueAsNumber: true })}
                      className={errors.currentWeightKg ? 'border-destructive' : ''}
                    />
                    {errors.currentWeightKg && (
                      <p className="text-xs text-destructive">{errors.currentWeightKg.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="targetWeightKg" className="text-xs font-semibold">Target Weight (kg) — Optional</Label>
                  <Input
                    id="targetWeightKg"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    {...register('targetWeightKg', { valueAsNumber: true })}
                  />
                </div>

                {/* Live Visual BMI Spectrum Gauge */}
                <BMISpectrumGauge bmi={previewBmi} category={bmiCategory} />
              </CardContent>
            </>
          )}

          {/* STEP 3: Goals & Activity */}
          {step === 3 && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" />
                  <CardTitle className="text-lg font-bold">Training Goal & Habits</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Primary Goal</Label>
                  <div className="grid gap-2 grid-cols-2">
                    {[
                      { id: 'WEIGHT_LOSS', label: 'Weight Loss', icon: Flame, desc: 'Caloric deficit' },
                      { id: 'MUSCLE_GAIN', label: 'Muscle Gain', icon: Dumbbell, desc: 'Hypertrophy' },
                      { id: 'STRENGTH_TARGET', label: 'Strength Focus', icon: Zap, desc: 'Heavy lifts' },
                      { id: 'WORKOUT_FREQUENCY', label: 'Consistency', icon: TrendingUp, desc: 'Habit building' },
                    ].map((g) => {
                      const Icon = g.icon;
                      const isSelected = selectedGoal === g.id;
                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => {
                            const event = { target: { value: g.id, name: 'fitnessGoal' } };
                            register('fitnessGoal').onChange(event);
                          }}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                              : 'border-border/70 hover:bg-muted/40'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs block">{g.label}</span>
                            <span className="text-[10px] text-muted-foreground">{g.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Activity Level</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    {...register('activityLevel')}
                  >
                    <option value="SEDENTARY">Sedentary (Desk job, minimal exercise)</option>
                    <option value="LIGHTLY_ACTIVE">Lightly Active (1-3 days / week)</option>
                    <option value="MODERATELY_ACTIVE">Moderately Active (3-5 days / week)</option>
                    <option value="VERY_ACTIVE">Very Active (6-7 days / week)</option>
                    <option value="EXTRA_ACTIVE">Extra Active (Hard training / physical work)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Experience Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BEGINNER', label: 'Beginner' },
                      { id: 'INTERMEDIATE', label: 'Intermediate' },
                      { id: 'ADVANCED', label: 'Advanced' },
                    ].map((exp) => (
                      <button
                        type="button"
                        key={exp.id}
                        onClick={() => {
                          const event = { target: { value: exp.id, name: 'experienceLevel' } };
                          register('experienceLevel').onChange(event);
                        }}
                        className={`flex h-10 items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                          watch('experienceLevel') === exp.id
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                            : 'border-input hover:bg-muted/40'
                        }`}
                      >
                        {exp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </CardContent>
            </>
          )}

          <CardFooter className="flex justify-between border-t border-border pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={prevStep} disabled={isLoading} className="text-xs font-semibold">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" size="sm" onClick={nextStep} className="text-xs font-bold gap-1">
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={isLoading} className="text-xs font-black gap-2 shadow-md shadow-primary/20">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
