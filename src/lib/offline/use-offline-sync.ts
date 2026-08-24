'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectionStateManager } from './connection-state';
import { OfflineQueueService } from './offline-queue';
import type { ConnectionState, OfflineActionType } from './types';

export function useOfflineSync() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('ONLINE');
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    ConnectionStateManager.init();
    const unsubscribe = ConnectionStateManager.subscribe((state) => {
      setConnectionState(state);
      setPendingCount(OfflineQueueService.getPendingCount());
    });

    const handleOnline = () => {
      OfflineQueueService.drainQueue().then(() => {
        setPendingCount(OfflineQueueService.getPendingCount());
      });
    };

    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const syncNow = useCallback(async () => {
    const result = await OfflineQueueService.drainQueue();
    setPendingCount(OfflineQueueService.getPendingCount());
    return result;
  }, []);

  const enqueueAction = useCallback(
    (
      type: OfflineActionType,
      endpoint: string,
      method: 'POST' | 'PATCH' | 'DELETE',
      payload: unknown,
      idempotencyKey: string
    ) => {
      const item = OfflineQueueService.enqueue(
        type,
        endpoint,
        method,
        payload,
        idempotencyKey
      );
      setPendingCount(OfflineQueueService.getPendingCount());
      return item;
    },
    []
  );

  return {
    connectionState,
    isOnline: connectionState === 'ONLINE',
    isOffline: connectionState === 'OFFLINE',
    isSyncing: connectionState === 'SYNCING',
    isError: connectionState === 'ERROR',
    pendingCount,
    syncNow,
    enqueueAction,
  };
}
