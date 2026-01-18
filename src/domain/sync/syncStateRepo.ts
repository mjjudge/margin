// src/domain/sync/syncStateRepo.ts
// Manages sync state (last_sync_at) per table in local SQLite

import { getDb } from '../../data/db';
import { SyncState, SyncTable } from './syncTypes';

/**
 * Get sync state for a table
 */
export async function getSyncState(table: SyncTable): Promise<SyncState> {
  const db = await getDb();
  const key = `last_sync_at:${table}`;
  
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_state WHERE key = ?',
    [key]
  );
  
  return {
    table,
    lastSyncAt: row?.value,
  };
}

/**
 * Update sync state for a table
 */
export async function setSyncState(table: SyncTable, lastSyncAt: string): Promise<void> {
  const db = await getDb();
  const key = `last_sync_at:${table}`;
  
  await db.runAsync(
    `INSERT INTO sync_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, lastSyncAt]
  );
}

/**
 * Clear sync state for a table (useful for forcing full resync)
 */
export async function clearSyncState(table: SyncTable): Promise<void> {
  const db = await getDb();
  const key = `last_sync_at:${table}`;
  
  await db.runAsync('DELETE FROM sync_state WHERE key = ?', [key]);
}

/**
 * Clear all sync state (full reset)
 */
export async function clearAllSyncState(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_state WHERE key LIKE ?', ['last_sync_at:%']);
}
