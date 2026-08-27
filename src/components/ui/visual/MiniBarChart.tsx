'use client';

import React from 'react';

export interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  isHighlight?: boolean;
}

interface MiniBarChartProps {
  data: BarDataPoint[];
  height?: number;
  unit?: string;
  className?: string;
}

export function MiniBarChart({
  data,
  height = 140,
  unit = '',
  className = '',
}: MiniBarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-end justify-between gap-2 pt-4" style={{ height }}>
        {data.map((item, index) => {
          const heightPercent = Math.max(8, (item.value / maxValue) * 100);
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center justify-end h-full group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold py-0.5 px-1.5 rounded shadow border border-border pointer-events-none whitespace-nowrap z-10">
                {item.value} {unit}
              </div>

              {/* Bar */}
              <div className="w-full max-w-[28px] bg-muted/40 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                    item.isHighlight
                      ? 'bg-gradient-to-t from-primary to-emerald-400 shadow-sm shadow-primary/30'
                      : item.value > 0
                      ? 'bg-primary/60 hover:bg-primary'
                      : 'bg-muted/30'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Bottom Label */}
              <span
                className={`mt-2 text-[10px] font-semibold tracking-wider ${
                  item.isHighlight ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
