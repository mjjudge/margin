export type SyncTable = 'meaning_entries' | 'practice_sessions';

export interface SyncState {
  table: SyncTable;
  lastSyncAt?: string; // ISO timestamp
}

export interface SyncResult {
  table: SyncTable;
  pulled: number;
  pushed: number;
  conflictsResolved: number;
  errors: string[];
}
