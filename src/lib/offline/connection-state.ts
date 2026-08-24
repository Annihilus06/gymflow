import type { ConnectionState } from './types';

type StateListener = (state: ConnectionState) => void;

export class ConnectionStateManager {
  private static currentState: ConnectionState = 'ONLINE';
  private static listeners: Set<StateListener> = new Set();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.currentState = navigator.onLine ? 'ONLINE' : 'OFFLINE';

    window.addEventListener('online', () => {
      this.setState('ONLINE');
    });

    window.addEventListener('offline', () => {
      this.setState('OFFLINE');
    });

    this.isInitialized = true;
  }

  static getState(): ConnectionState {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.init();
    }
    return this.currentState;
  }

  static setState(newState: ConnectionState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.listeners.forEach((listener) => listener(newState));
  }

  static subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
