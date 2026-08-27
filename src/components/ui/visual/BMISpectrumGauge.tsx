'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BMISpectrumGaugeProps {
  bmi: number | null;
  category: string | null;
  className?: string;
}

export function BMISpectrumGauge({ bmi, category, className = '' }: BMISpectrumGaugeProps) {
  if (bmi === null) return null;

  // Scale BMI (15 to 35) to 0% - 100% position
  const minBmi = 15;
  const maxBmi = 35;
  const clampedBmi = Math.min(maxBmi, Math.max(minBmi, bmi));
  const pointerPercent = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;

  const getCategoryColor = (cat: string | null) => {
    switch (cat) {
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
    <div className={`space-y-3 rounded-xl border border-border/80 bg-card/60 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          BMI Index
        </span>
        <Badge
          variant="outline"
          className={`text-xs font-semibold px-2 py-0.5 border ${getCategoryColor(category)}`}
        >
          {category || 'Calculated'}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-foreground">{bmi}</span>
        <span className="text-xs text-muted-foreground">kg/m²</span>
      </div>

      {/* Visual Spectrum Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500" />
        
        {/* Dynamic Pointer Marker */}
        <div className="relative h-2 w-full">
          <div
            className="absolute -top-3.5 -translate-x-1/2 transition-all duration-500 ease-out"
            style={{ left: `${pointerPercent}%` }}
          >
            <div className="h-3 w-3 rounded-full border-2 border-background bg-foreground shadow-md ring-2 ring-primary/40" />
          </div>
        </div>

        {/* Range Labels */}
        <div className="flex justify-between text-[10px] font-medium text-muted-foreground/80 px-0.5">
          <span>&lt;18.5 (Under)</span>
          <span>18.5 - 24.9 (Normal)</span>
          <span>25 - 29.9 (Over)</span>
          <span>30+ (Obese)</span>
        </div>
      </div>
    </div>
  );
}
