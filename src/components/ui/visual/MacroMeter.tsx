'use client';

import React from 'react';
import { Flame, Activity } from 'lucide-react';

interface MacroMeterProps {
  currentCalories?: number;
  targetCalories?: number;
  currentProtein?: number;
  targetProtein?: number;
  className?: string;
}

export function MacroMeter({
  currentCalories = 0,
  targetCalories = 2000,
  currentProtein = 0,
  targetProtein = 150,
  className = '',
}: MacroMeterProps) {
  const calPercent = targetCalories > 0 ? Math.min(100, Math.round((currentCalories / targetCalories) * 100)) : 0;
  const proteinPercent = targetProtein > 0 ? Math.min(100, Math.round((currentProtein / targetProtein) * 100)) : 0;

  return (
    <div className={`space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Daily Fuel Targets
        </span>
        <span className="text-[11px] font-semibold text-primary">Energy & Macros</span>
      </div>

      {/* Calories Progress Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-orange-400">
            <Flame className="h-3.5 w-3.5 fill-current" />
            <span>Calories</span>
          </div>
          <span className="font-semibold text-foreground">
            {currentCalories > 0 ? `${currentCalories} / ` : ''}
            {targetCalories} <span className="text-muted-foreground text-[10px]">kcal</span>
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
            style={{ width: `${currentCalories > 0 ? calPercent : 100}%` }}
          />
        </div>
      </div>

      {/* Protein Progress Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Activity className="h-3.5 w-3.5" />
            <span>Protein</span>
          </div>
          <span className="font-semibold text-foreground">
            {currentProtein > 0 ? `${currentProtein} / ` : ''}
            {targetProtein} <span className="text-muted-foreground text-[10px]">g</span>
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${currentProtein > 0 ? proteinPercent : 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
