'use client';

import React from 'react';
import { Dumbbell } from 'lucide-react';

interface GymFlowLoaderProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

export function GymFlowLoader({
  label = 'GymFlow',
  sublabel = 'Loading workout experience...',
  fullScreen = false,
}: GymFlowLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center animate-in fade-in duration-300">
      {/* Animated Glowing Dual Rings + Dumbbell Heartbeat */}
      <div className="relative flex items-center justify-center h-20 w-20">
        {/* Outer glowing pulsing aura */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-60" />

        {/* Orbiting Neon Gradient Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin" />

        {/* Reverse Secondary Inner Ring */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-primary/70 border-l-primary/30 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />

        {/* Center Dumbbell Icon Badge */}
        <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce [animation-duration:2s]">
          <Dumbbell className="h-6 w-6" />
        </div>
      </div>

      {/* Brand & Sublabel with subtle shimmer */}
      <div className="space-y-1">
        <h3 className="text-base font-black tracking-tight text-foreground">
          {label}
        </h3>
        <p className="text-xs text-muted-foreground animate-pulse">
          {sublabel}
        </p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="flex min-h-[280px] w-full items-center justify-center">{content}</div>;
}
