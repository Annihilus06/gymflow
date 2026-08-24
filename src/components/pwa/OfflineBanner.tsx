'use client';

import React from 'react';
import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { WifiOff, RefreshCw, AlertTriangle, CloudCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function OfflineBanner() {
  const { connectionState, isOffline, isSyncing, isError, pendingCount, syncNow } = useOfflineSync();

  if (connectionState === 'ONLINE' && pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-4 py-2 text-xs flex items-center justify-between border-b transition-colors ${
        isOffline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          : isSyncing
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
          : isError
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : 'bg-primary/10 border-primary/30 text-primary'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOffline ? (
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
        ) : isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : isError ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <CloudCheck className="h-3.5 w-3.5 shrink-0" />
        )}

        <span className="font-semibold">
          {isOffline
            ? 'Working Offline'
            : isSyncing
            ? 'Syncing cached workout data...'
            : isError
            ? 'Sync error. Check connection.'
            : 'Online'}
        </span>

        {pendingCount > 0 && (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
            {pendingCount} {pendingCount === 1 ? 'action' : 'actions'} queued
          </Badge>
        )}
      </div>

      {pendingCount > 0 && (
        <Button
          type="button"
          onClick={() => syncNow()}
          disabled={isSyncing}
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2 gap-1 font-semibold"
          aria-label="Sync offline data now"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      )}
    </div>
  );
}
