'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  indicatorClassName?: string;
  label?: string;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value = 0, indicatorClassName, label, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value ?? 0));

    return (
      <ProgressPrimitive.Root
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out',
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </ProgressPrimitive.Root>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
