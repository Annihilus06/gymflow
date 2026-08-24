'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Flame, Activity, ChevronRight } from 'lucide-react';
import type { UserProfileResponse } from '@/lib/services/profile.service';

interface BiometricsOverviewProps {
  profileData: UserProfileResponse | null;
}

export function BiometricsOverview({ profileData }: BiometricsOverviewProps) {
  const metrics = profileData?.metrics;
  const profile = profileData?.profile;

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          Biometric & Nutrition Metrics
        </h2>
        <Link href="/nutrition">
          <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-muted">
            Details
            <ChevronRight className="h-2.5 w-2.5" />
          </Badge>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Weight Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-semibold">Body Weight</CardDescription>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.currentWeightKg ? `${metrics.currentWeightKg} kg` : '--'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Height: {profile?.heightCm ? `${profile.heightCm} cm` : '--'}
            </p>
          </CardContent>
        </Card>

        {/* BMI Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-semibold">BMI Index</CardDescription>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
              {metrics.bmiCategory || 'N/A'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              {metrics.bmi ?? '--'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">WHO Standard model</p>
          </CardContent>
        </Card>

        {/* Daily Calorie Target */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-semibold">Calorie Target</CardDescription>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.dailyCalorieTarget ? `${metrics.dailyCalorieTarget} kcal` : '--'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              TDEE: {metrics.tdee ?? '--'} kcal
            </p>
          </CardContent>
        </Card>

        {/* Daily Protein Target */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-semibold">Protein Target</CardDescription>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.dailyProteinTargetG ? `${metrics.dailyProteinTargetG} g` : '--'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sports nutrition ratio</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
