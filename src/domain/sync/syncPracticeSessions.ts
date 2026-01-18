// src/domain/sync/syncPracticeSessions.ts
// Bi-directional sync for practice_sessions table

import { SyncResult } from './syncTypes';
import { getSyncState, setSyncState } from './syncStateRepo';
import { SYNC_CONFIG } from './syncConfig';
import { supabase } from '../../data/supabaseClient';
import { getDb } from '../../data/db';

interface SessionRow {
  id: string;
  practice_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  user_rating: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RemoteSession {
  id: string;
  user_id: string;
  practice_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  user_rating: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Sync practice sessions between local SQLite and Supabase.
 * 
 * Strategy:
 * 1. Pull remote changes since lastSyncAt
 * 2. Upsert to local (server wins if server.updated_at > local.updated_at)
 * 3. Push local changes since lastSyncAt
 * 4. Update lastSyncAt
 */
export async function syncPracticeSessions(): Promise<SyncResult> {
  const result: SyncResult = {
    table: 'practice_sessions',
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

    const syncState = await getSyncState('practice_sessions');
    const syncStartTime = new Date().toISOString();
    const db = await getDb();

    // ========== PULL ==========
    try {
      let query = supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: true })
        .limit(SYNC_CONFIG.maxBatchSize);

      if (syncState.lastSyncAt) {
        query = query.gt('updated_at', syncState.lastSyncAt);
      }

      const { data: remoteSessions, error: pullError } = await query;

      if (pullError) {
        result.errors.push(`Pull error: ${pullError.message}`);
      } else if (remoteSessions && remoteSessions.length > 0) {
        for (const remote of remoteSessions as RemoteSession[]) {
          // Check if local exists
          const localRow = await db.getFirstAsync<SessionRow>(
            'SELECT * FROM practice_sessions WHERE id = ?',
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
              `INSERT INTO practice_sessions (id, practice_id, started_at, completed_at, status, user_rating, notes, created_at, updated_at, deleted_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 practice_id = excluded.practice_id,
                 started_at = excluded.started_at,
                 completed_at = excluded.completed_at,
                 status = excluded.status,
                 user_rating = excluded.user_rating,
                 notes = excluded.notes,
                 updated_at = excluded.updated_at,
                 deleted_at = excluded.deleted_at`,
              [
                remote.id,
                remote.practice_id,
                remote.started_at,
                remote.completed_at,
                remote.status,
                remote.user_rating,
                remote.notes,
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
      // Get local sessions updated since last sync
      let localQuery = 'SELECT * FROM practice_sessions WHERE 1=1';
      const params: string[] = [];

      if (syncState.lastSyncAt) {
        localQuery += ' AND updated_at > ?';
        params.push(syncState.lastSyncAt);
      }

      localQuery += ' ORDER BY updated_at ASC LIMIT ?';
      params.push(String(SYNC_CONFIG.maxBatchSize));

      const localRows = await db.getAllAsync<SessionRow>(localQuery, params);

      for (const local of localRows) {
        // Check remote to see if we should push
        const { data: remoteSession } = await supabase
          .from('practice_sessions')
          .select('updated_at')
          .eq('id', local.id)
          .single();

        // Only push if local is newer or remote doesn't exist
        const shouldPush = !remoteSession || 
          new Date(local.updated_at) > new Date(remoteSession.updated_at);

        if (shouldPush) {
          const { error: upsertError } = await supabase
            .from('practice_sessions')
            .upsert({
              id: local.id,
              user_id: user.id,
              practice_id: local.practice_id,
              started_at: local.started_at,
              completed_at: local.completed_at,
              status: local.status,
              user_rating: local.user_rating,
              notes: local.notes,
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
      await setSyncState('practice_sessions', syncStartTime);
    }

  } catch (err) {
    result.errors.push(`Sync exception: ${String(err)}`);
  }

  return result;
}
