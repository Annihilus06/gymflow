export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';

export type OfflineActionType =
  | 'LOG_SET'
  | 'UPDATE_SET'
  | 'DELETE_SET'
  | 'LOG_MEAL'
  | 'UPDATE_GOAL_PROGRESS';

export interface OfflineQueueItem {
  id: string;
  type: OfflineActionType;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: unknown;
  idempotencyKey: string;
  createdAt: number;
  retryCount: number;
}
