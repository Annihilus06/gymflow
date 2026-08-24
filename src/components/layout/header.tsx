'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Dumbbell className="h-5 w-5" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          Gym<span className="text-primary">Flow</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/settings" passHref>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            aria-label="User Settings"
          >
            <User className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
