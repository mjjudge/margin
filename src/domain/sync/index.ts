// src/domain/sync/index.ts
// Public API for sync module

export { runFullSync, syncEntries, syncSessions } from './syncEngine';
export type { FullSyncResult } from './syncEngine';
export { getSyncState, setSyncState, clearSyncState, clearAllSyncState } from './syncStateRepo';
export type { SyncResult, SyncState, SyncTable } from './syncTypes';
export { SYNC_CONFIG } from './syncConfig';
export { useSyncOnForeground } from './useSyncOnForeground';
