import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionStateManager } from '@/lib/offline/connection-state';

describe('ConnectionStateManager', () => {
  beforeEach(() => {
    ConnectionStateManager.setState('ONLINE');
  });

  it('initializes with ONLINE by default', () => {
    expect(ConnectionStateManager.getState()).toBe('ONLINE');
  });

  it('updates state and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = ConnectionStateManager.subscribe(listener);

    expect(listener).toHaveBeenCalledWith('ONLINE');

    ConnectionStateManager.setState('OFFLINE');
    expect(listener).toHaveBeenCalledWith('OFFLINE');
    expect(ConnectionStateManager.getState()).toBe('OFFLINE');

    ConnectionStateManager.setState('SYNCING');
    expect(listener).toHaveBeenCalledWith('SYNCING');

    ConnectionStateManager.setState('ERROR');
    expect(listener).toHaveBeenCalledWith('ERROR');

    unsubscribe();
    listener.mockClear();
    ConnectionStateManager.setState('ONLINE');
    expect(listener).not.toHaveBeenCalled();
  });
});
