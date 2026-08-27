import React from 'react';
import { GymFlowLoader } from '@/components/ui/GymFlowLoader';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full" aria-busy="true" aria-label="Loading dashboard">
      <GymFlowLoader label="GymFlow Dashboard" sublabel="Loading workouts, goals & muscle wiki..." />
    </div>
  );
}
