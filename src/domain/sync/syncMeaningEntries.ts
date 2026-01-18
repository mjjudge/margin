import { SyncResult } from './syncTypes';

/**
 * Contract:
 * - Pull remote rows updated since lastSyncAt (including deleted_at changes)
 * - Upsert into local SQLite by id
 * - Push local rows updated since lastSyncAt to remote via upsert
 * - Conflict: last-write-wins by updated_at (server wins when newer)
 * - Update lastSyncAt at end if no fatal errors
 */
export async function syncMeaningEntries(): Promise<SyncResult> {
  return {
    table: 'meaning_entries',
    pulled: 0,
    pushed: 0,
    conflictsResolved: 0,
    errors: ['not implemented'],
  };
}
