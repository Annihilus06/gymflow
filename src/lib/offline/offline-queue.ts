import { ConnectionStateManager } from './connection-state';
import type { OfflineQueueItem, OfflineActionType } from './types';

const STORAGE_KEY = 'gymflow_offline_queue_v1';

export class OfflineQueueService {
  private static getStoredQueue(): OfflineQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveQueue(items: OfflineQueueItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable / quota exceeded
    }
  }

  /**
   * Enqueues an offline action with idempotency key deduplication (RULE-API-004, RULE-TEST-005).
   */
  static enqueue(
    type: OfflineActionType,
    endpoint: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    payload: unknown,
    idempotencyKey: string
  ): OfflineQueueItem {
    const queue = this.getStoredQueue();

    // Check for duplicate idempotency key
    const existing = queue.find((item) => item.idempotencyKey === idempotencyKey);
    if (existing) {
      return existing;
    }

    const newItem: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      endpoint,
      method,
      payload,
      idempotencyKey,
      createdAt: Date.now(),
      retryCount: 0,
    };

    queue.push(newItem);
    this.saveQueue(queue);
    return newItem;
  }

  static getPendingCount(): number {
    return this.getStoredQueue().length;
  }

  static getQueue(): OfflineQueueItem[] {
    return this.getStoredQueue();
  }

  static remove(id: string): void {
    const queue = this.getStoredQueue().filter((item) => item.id !== id);
    this.saveQueue(queue);
  }

  static clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Drains the offline mutation queue in FIFO order with idempotency headers.
   */
  static async drainQueue(): Promise<{
    syncedCount: number;
    failedCount: number;
  }> {
    const queue = this.getStoredQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    ConnectionStateManager.setState('SYNCING');
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': item.idempotencyKey,
          },
          body: item.payload ? JSON.stringify(item.payload) : undefined,
        });

        // 200/201 Success, or 409 Conflict/Duplicate already recorded
        if (res.ok || res.status === 409) {
          this.remove(item.id);
          syncedCount++;
        } else if (res.status >= 400 && res.status < 500) {
          // Client error that cannot be resolved by retry
          this.remove(item.id);
          failedCount++;
        } else {
          item.retryCount++;
          failedCount++;
        }
      } catch {
        item.retryCount++;
        failedCount++;
        ConnectionStateManager.setState('ERROR');
        return { syncedCount, failedCount };
      }
    }

    const remaining = this.getStoredQueue();
    if (remaining.length === 0) {
      ConnectionStateManager.setState('ONLINE');
    } else {
      ConnectionStateManager.setState('ERROR');
    }

    return { syncedCount, failedCount };
  }
}
