import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      {/* Top Welcome Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted rounded-md" />
        </div>
        <div className="h-6 w-24 bg-muted rounded-full" />
      </div>

      {/* Today Workout Focus Skeleton */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="space-y-2 pb-3">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-7 w-56 bg-muted rounded" />
          <div className="h-4 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="h-16 bg-muted/60 rounded-lg" />
            <div className="h-16 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-10 w-full sm:w-48 bg-muted rounded-lg" />
        </CardContent>
      </Card>

      {/* Calendar Mini Strip Skeleton */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="h-4 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted/40 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats & Active Goal Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-7 w-20 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-2 w-full bg-muted rounded" />
            <div className="h-4 w-44 bg-muted rounded" />
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-7 w-48 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-2 w-full bg-muted rounded" />
            <div className="h-4 w-44 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Biometrics Skeleton Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-6 w-16 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-28 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
