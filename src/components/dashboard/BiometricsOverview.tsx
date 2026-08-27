'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Flame, Activity, ChevronRight, Zap } from 'lucide-react';
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

  const getBmiBadgeStyle = (category?: string | null) => {
    switch (category) {
      case 'Underweight':
        return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
      case 'Normal weight':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'Overweight':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'Obesity':
        return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      default:
        return 'text-primary bg-primary/10 border-primary/30';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Biometrics & Fuel
        </h3>
        <Link href="/nutrition">
          <Badge variant="outline" className="text-[11px] font-semibold gap-1 text-primary hover:bg-primary/10">
            Targets
            <ChevronRight className="h-3 w-3" />
          </Badge>
        </Link>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Weight */}
        <Card className="bg-card border-border/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Weight</span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {metrics.currentWeightKg ? `${metrics.currentWeightKg}` : '--'}
            <span className="text-xs font-semibold text-muted-foreground ml-1">kg</span>
          </div>
          <div className="mt-2 text-[10px] font-medium text-muted-foreground">
            Height: {profile?.heightCm ? `${profile.heightCm} cm` : '--'}
          </div>
        </Card>

        {/* BMI */}
        <Card className="bg-card border-border/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">BMI</span>
            <Badge
              variant="outline"
              className={`text-[9px] font-bold px-1.5 py-0 border ${getBmiBadgeStyle(metrics.bmiCategory)}`}
            >
              {metrics.bmiCategory || 'N/A'}
            </Badge>
          </div>
          <div className="text-2xl font-black text-primary">
            {metrics.bmi ?? '--'}
          </div>
          {/* Visual BMI Bar */}
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500" />
        </Card>

        {/* Calories */}
        <Card className="bg-card border-border/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Calories</span>
            <div className="h-7 w-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Flame className="h-3.5 w-3.5 fill-current" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {metrics.dailyCalorieTarget ?? '--'}
            <span className="text-xs font-semibold text-muted-foreground ml-1">kcal</span>
          </div>
          {/* Calorie visual meter */}
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 w-[85%]" />
          </div>
        </Card>

        {/* Protein */}
        <Card className="bg-card border-border/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Protein</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {metrics.dailyProteinTargetG ?? '--'}
            <span className="text-xs font-semibold text-muted-foreground ml-1">g</span>
          </div>
          {/* Protein visual meter */}
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[90%]" />
          </div>
        </Card>
      </div>
    </div>
  );
}
