'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side error
    console.error('GymFlow Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center space-y-5 max-w-md mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 shadow-lg">
        <AlertCircle className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-black tracking-tight text-foreground">Something went wrong</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error.message || 'An unexpected client error occurred while loading this view.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => reset()}
          size="sm"
          className="gap-2 font-bold shadow-md shadow-primary/20 h-9 px-4"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>

        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2 font-semibold h-9 px-4">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
