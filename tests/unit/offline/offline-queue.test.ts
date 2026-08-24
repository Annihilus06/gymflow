import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineQueueService } from '@/lib/offline/offline-queue';
import { ConnectionStateManager } from '@/lib/offline/connection-state';

describe('OfflineQueueService', () => {
  beforeEach(() => {
    OfflineQueueService.clear();
    ConnectionStateManager.setState('ONLINE');
    vi.restoreAllMocks();
  });

  it('enqueues a mutation item and tracks pending count', () => {
    expect(OfflineQueueService.getPendingCount()).toBe(0);

    const item = OfflineQueueService.enqueue(
      'LOG_SET',
      '/api/sessions/s1/sets',
      'POST',
      { weightKg: 80, reps: 8 },
      'idem_key_123'
    );

    expect(item.id).toBeDefined();
    expect(item.idempotencyKey).toBe('idem_key_123');
    expect(OfflineQueueService.getPendingCount()).toBe(1);
  });

  it('deduplicates identical idempotency keys (RULE-API-004, RULE-TEST-005)', () => {
    const item1 = OfflineQueueService.enqueue(
      'LOG_SET',
      '/api/sessions/s1/sets',
      'POST',
      { weightKg: 80, reps: 8 },
      'duplicate_key_1'
    );

    const item2 = OfflineQueueService.enqueue(
      'LOG_SET',
      '/api/sessions/s1/sets',
      'POST',
      { weightKg: 80, reps: 8 },
      'duplicate_key_1'
    );

    expect(item1.id).toBe(item2.id);
    expect(OfflineQueueService.getPendingCount()).toBe(1);
  });

  it('removes item by ID and clears queue', () => {
    const item = OfflineQueueService.enqueue(
      'LOG_MEAL',
      '/api/nutrition/meals',
      'POST',
      { name: 'Oatmeal', estimatedCalories: 400 },
      'meal_key_1'
    );

    expect(OfflineQueueService.getPendingCount()).toBe(1);
    OfflineQueueService.remove(item.id);
    expect(OfflineQueueService.getPendingCount()).toBe(0);
  });

  it('drains queue on reconnection sending X-Idempotency-Key headers', async () => {
    OfflineQueueService.enqueue(
      'LOG_SET',
      '/api/sessions/s1/sets',
      'POST',
      { weightKg: 100, reps: 5 },
      'sync_test_key'
    );

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await OfflineQueueService.drainQueue();

    expect(result.syncedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(OfflineQueueService.getPendingCount()).toBe(0);
    expect(ConnectionStateManager.getState()).toBe('ONLINE');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sessions/s1/sets',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Idempotency-Key': 'sync_test_key',
        }),
      })
    );
  });
});
