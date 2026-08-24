'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/profile.schema';
import type { UserProfileResponse } from '@/lib/services/profile.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Flame,
  Scale,
} from 'lucide-react';

export default function SettingsPage() {
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data: UserProfileResponse = await res.json();
          setProfileData(data);
          reset({
            name: data.name || '',
            dateOfBirth: data.profile?.dateOfBirth
              ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0]
              : '',
            sex: data.profile?.sex || 'OTHER',
            heightCm: data.profile?.heightCm || undefined,
            currentWeightKg: data.metrics.currentWeightKg || undefined,
            activityLevel: data.profile?.activityLevel || 'MODERATELY_ACTIVE',
            experienceLevel: data.profile?.experienceLevel || 'BEGINNER',
            weightUnit: data.profile?.weightUnit || 'KG',
            notificationsEnabled: data.profile?.notificationsEnabled || false,
          });
        }
      } catch {
        setStatusMessage({ type: 'error', text: 'Failed to load profile data.' });
      } finally {
        setIsFetching(false);
      }
    }

    loadProfile();
  }, [reset]);

  const onSave = async (data: UpdateProfileInput) => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setStatusMessage({ type: 'error', text: json.message || 'Failed to update profile.' });
        setIsSaving(false);
        return;
      }

      const updated: UserProfileResponse = await res.json();
      setProfileData(updated);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsSaving(false);
    } catch {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred.' });
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Account & Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal details, biometric targets, and account settings.
        </p>
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Calculated Metrics Overview */}
      {profileData?.metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">Body Mass Index</CardDescription>
                <Badge variant="success" className="text-[10px]">
                  {profileData.metrics.bmiCategory || 'N/A'}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black text-primary">
                {profileData.metrics.bmi ?? '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Deterministic WHO calculation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                <CardDescription className="text-xs">Daily Calorie Target</CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold">
                {profileData.metrics.dailyCalorieTarget ? `${profileData.metrics.dailyCalorieTarget} kcal` : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                TDEE: {profileData.metrics.tdee ?? '--'} kcal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-500" />
                <CardDescription className="text-xs">Protein Target</CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold">
                {profileData.metrics.dailyProteinTargetG ? `${profileData.metrics.dailyProteinTargetG} g` : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Goal-optimized intake</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-blue-500" />
                <CardDescription className="text-xs">Current Weight</CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold">
                {profileData.metrics.currentWeightKg ? `${profileData.metrics.currentWeightKg} kg` : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Height: {profileData.profile?.heightCm ? `${profileData.profile.heightCm} cm` : '--'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            <CardTitle>Profile Details</CardTitle>
          </div>
          <CardDescription>Update your personal information and biometric metrics.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" value={profileData?.email || ''} disabled className="opacity-70" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  {...register('heightCm', { valueAsNumber: true })}
                />
                {errors.heightCm && (
                  <p className="text-xs text-destructive">{errors.heightCm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentWeightKg">Log New Weight (kg)</Label>
                <Input
                  id="currentWeightKg"
                  type="number"
                  step="0.1"
                  {...register('currentWeightKg', { valueAsNumber: true })}
                />
                {errors.currentWeightKg && (
                  <p className="text-xs text-destructive">{errors.currentWeightKg.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <select
                  id="activityLevel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('activityLevel')}
                >
                  <option value="SEDENTARY">Sedentary</option>
                  <option value="LIGHTLY_ACTIVE">Lightly Active</option>
                  <option value="MODERATELY_ACTIVE">Moderately Active</option>
                  <option value="VERY_ACTIVE">Very Active</option>
                  <option value="EXTRA_ACTIVE">Extra Active</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <select
                  id="experienceLevel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('experienceLevel')}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={isSaving || !isDirty} className="font-semibold gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Actions & Sign Out */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Account Session</CardTitle>
          <CardDescription>Sign out of your active session on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
