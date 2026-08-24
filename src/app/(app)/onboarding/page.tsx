'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingSchema, type OnboardingInput } from '@/lib/validations/profile.schema';
import { calculateBMI, getBMICategory } from '@/lib/utils/bmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Scale,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
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

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const progressPercentage = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Onboarding Header */}
      <div className="space-y-2 text-center">
        <Badge variant="outline" className="text-primary border-primary/30">
          Step {step} of 3
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Set Up Your Profile</h1>
        <p className="text-sm text-muted-foreground">
          We use this to calculate your exact BMI, calorie targets, and recommended volume.
        </p>
        <Progress value={progressPercentage} className="h-1.5 w-full mt-2" label="Onboarding Progress" />
      </div>

      <Card className="border-border/80 bg-card shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-5 w-5" />
                  <CardTitle className="text-xl">Personal Information</CardTitle>
                </div>
                <CardDescription>
                  Tell us a bit about yourself for accurate metabolic calculations.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
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

                <div className="space-y-2">
                  <Label>Biological Sex (for metabolic equation)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['MALE', 'FEMALE', 'OTHER'] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          const event = { target: { value: s, name: 'sex' } };
                          register('sex').onChange(event);
                        }}
                        className={`flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                          selectedSex === s
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-input hover:bg-accent'
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
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Scale className="h-5 w-5" />
                  <CardTitle className="text-xl">Body Measurements</CardTitle>
                </div>
                <CardDescription>
                  Enter your current height and weight. All weights are stored securely in kg.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Height (cm)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="currentWeightKg">Current Weight (kg)</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="targetWeightKg">Target Weight (kg) — Optional</Label>
                  <Input
                    id="targetWeightKg"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    {...register('targetWeightKg', { valueAsNumber: true })}
                  />
                </div>

                {/* Real-time calculated BMI Card */}
                {previewBmi !== null && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Calculated BMI
                      </span>
                      <Badge variant="success">{bmiCategory}</Badge>
                    </div>
                    <div className="text-3xl font-extrabold text-primary">{previewBmi}</div>
                    <p className="text-xs text-muted-foreground">
                      Calculated deterministically using height and weight.
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* STEP 3: Goals & Activity */}
          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" />
                  <CardTitle className="text-xl">Fitness Goal & Activity</CardTitle>
                </div>
                <CardDescription>
                  Help GymFlow customize your workout volume and daily nutrition targets.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Fitness Goal</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { id: 'WEIGHT_LOSS', label: 'Weight Loss', desc: 'Caloric deficit & fat loss' },
                      { id: 'MUSCLE_GAIN', label: 'Muscle Gain', desc: 'Hypertrophy & strength' },
                      { id: 'STRENGTH_TARGET', label: 'Strength Focus', desc: 'Peak power & lifts' },
                      { id: 'WORKOUT_FREQUENCY', label: 'Consistency', desc: 'Routine & habit building' },
                    ].map((g) => (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => {
                          const event = { target: { value: g.id, name: 'fitnessGoal' } };
                          register('fitnessGoal').onChange(event);
                        }}
                        className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                          selectedGoal === g.id
                            ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                            : 'border-input hover:bg-accent'
                        }`}
                      >
                        <span className="font-semibold text-sm">{g.label}</span>
                        <span className="text-xs text-muted-foreground">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register('activityLevel')}
                  >
                    <option value="SEDENTARY">Sedentary (Desk job, little exercise)</option>
                    <option value="LIGHTLY_ACTIVE">Lightly Active (Exercise 1-3 days/week)</option>
                    <option value="MODERATELY_ACTIVE">Moderately Active (Exercise 3-5 days/week)</option>
                    <option value="VERY_ACTIVE">Very Active (Exercise 6-7 days/week)</option>
                    <option value="EXTRA_ACTIVE">Extra Active (Hard exercise & physical job)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Experience Level</Label>
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
                        className={`flex h-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                          watch('experienceLevel') === exp.id
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-input hover:bg-accent'
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
                    className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
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
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="font-semibold gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
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
