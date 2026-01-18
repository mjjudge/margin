// src/domain/sync/syncMeaningEntries.ts
// Bi-directional sync for meaning_entries table

import { SyncResult } from './syncTypes';
import { getSyncState, setSyncState } from './syncStateRepo';
import { SYNC_CONFIG } from './syncConfig';
import { supabase } from '../../data/supabaseClient';
import { getDb } from '../../data/db';

interface MeaningRow {
  id: string;
  category: string;
  text: string | null;
  tags: string; // JSON string locally
  time_of_day: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RemoteMeaningEntry {
  id: string;
  user_id: string;
  category: string;
  text: string | null;
  tags: string[]; // JSONB array remotely
  time_of_day: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Sync meaning entries between local SQLite and Supabase.
 * 
 * Strategy:
 * 1. Pull remote changes since lastSyncAt
 * 2. Upsert to local (server wins if server.updated_at > local.updated_at)
 * 3. Push local changes since lastSyncAt
 * 4. Update lastSyncAt
 */
export async function syncMeaningEntries(): Promise<SyncResult> {
  const result: SyncResult = {
    table: 'meaning_entries',
    pulled: 0,
    pushed: 0,
    conflictsResolved: 0,
    errors: [],
  };

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      result.errors.push('Not authenticated');
      return result;
    }

    const syncState = await getSyncState('meaning_entries');
    const syncStartTime = new Date().toISOString();
    const db = await getDb();

    // ========== PULL ==========
    try {
      let query = supabase
        .from('meaning_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: true })
        .limit(SYNC_CONFIG.maxBatchSize);

      if (syncState.lastSyncAt) {
        query = query.gt('updated_at', syncState.lastSyncAt);
      }

      const { data: remoteEntries, error: pullError } = await query;

      if (pullError) {
        result.errors.push(`Pull error: ${pullError.message}`);
      } else if (remoteEntries && remoteEntries.length > 0) {
        for (const remote of remoteEntries as RemoteMeaningEntry[]) {
          // Check if local exists
          const localRow = await db.getFirstAsync<MeaningRow>(
            'SELECT * FROM meaning_entries WHERE id = ?',
            [remote.id]
          );

          const shouldUpsert = !localRow || 
            new Date(remote.updated_at) >= new Date(localRow.updated_at);

          if (shouldUpsert) {
            if (localRow && new Date(remote.updated_at) > new Date(localRow.updated_at)) {
              result.conflictsResolved++;
            }

            // Upsert to local
            await db.runAsync(
              `INSERT INTO meaning_entries (id, category, text, tags, time_of_day, created_at, updated_at, deleted_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 category = excluded.category,
                 text = excluded.text,
                 tags = excluded.tags,
                 time_of_day = excluded.time_of_day,
                 updated_at = excluded.updated_at,
                 deleted_at = excluded.deleted_at`,
              [
                remote.id,
                remote.category,
                remote.text,
                JSON.stringify(remote.tags || []),
                remote.time_of_day,
                remote.created_at,
                remote.updated_at,
                remote.deleted_at,
              ]
            );
            result.pulled++;
          }
        }
      }
    } catch (pullErr) {
      result.errors.push(`Pull exception: ${String(pullErr)}`);
    }

    // ========== PUSH ==========
    try {
      // Get local entries updated since last sync
      let localQuery = 'SELECT * FROM meaning_entries WHERE 1=1';
      const params: string[] = [];

      if (syncState.lastSyncAt) {
        localQuery += ' AND updated_at > ?';
        params.push(syncState.lastSyncAt);
      }

      localQuery += ' ORDER BY updated_at ASC LIMIT ?';
      params.push(String(SYNC_CONFIG.maxBatchSize));

      const localRows = await db.getAllAsync<MeaningRow>(localQuery, params);

      for (const local of localRows) {
        // Check remote to see if we should push
        const { data: remoteEntry } = await supabase
          .from('meaning_entries')
          .select('updated_at')
          .eq('id', local.id)
          .single();

        // Only push if local is newer or remote doesn't exist
        const shouldPush = !remoteEntry || 
          new Date(local.updated_at) > new Date(remoteEntry.updated_at);

        if (shouldPush) {
          let tags: string[] = [];
          try {
            tags = JSON.parse(local.tags);
          } catch {
            // Invalid JSON, use empty array
          }

          const { error: upsertError } = await supabase
            .from('meaning_entries')
            .upsert({
              id: local.id,
              user_id: user.id,
              category: local.category,
              text: local.text,
              tags,
              time_of_day: local.time_of_day,
              created_at: local.created_at,
              updated_at: local.updated_at,
              deleted_at: local.deleted_at,
            }, {
              onConflict: 'id',
            });

          if (upsertError) {
            result.errors.push(`Push error for ${local.id}: ${upsertError.message}`);
          } else {
            result.pushed++;
          }
        }
      }
    } catch (pushErr) {
      result.errors.push(`Push exception: ${String(pushErr)}`);
    }

    // ========== UPDATE SYNC STATE ==========
    if (result.errors.length === 0) {
      await setSyncState('meaning_entries', syncStartTime);
    }

  } catch (err) {
    result.errors.push(`Sync exception: ${String(err)}`);
  }

  return result;
}
