// src/domain/sync/syncFragmentReveals.ts
// Bi-directional sync for fragment_reveals table
// 
// Key differences from other sync modules:
// - Uses unique constraint (user_id, fragment_id) instead of timestamps for conflict resolution
// - If push fails due to uniqueness, treat as "already revealed elsewhere" (not an error)
// - Reveals are immutable - no updates, only inserts

import { SyncResult } from './syncTypes';
import { getSyncState, setSyncState } from './syncStateRepo';
import { supabase } from '../../data/supabaseClient';
import { fragmentsRepo } from '../../data/repos/fragmentsRepo';

interface RemoteReveal {
  id: string;
  user_id: string;
  fragment_id: string;
  revealed_at: string;
  created_at: string;
}

/**
 * Sync fragment reveals between local SQLite and Supabase.
 * 
 * Strategy:
 * 1. Pull all remote reveals (small dataset, <100 rows per user over 2 years)
 * 2. Merge into local (skip if already revealed locally)
 * 3. Push local unsynced reveals
 * 4. If push fails due to unique constraint → mark as synced (already revealed elsewhere)
 */
export async function syncFragmentReveals(): Promise<SyncResult> {
  const result: SyncResult = {
    table: 'fragment_reveals',
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

    const syncState = await getSyncState('fragment_reveals');
    const syncStartTime = new Date().toISOString();

    // ========== PULL ==========
    try {
      // Pull all reveals for this user (dataset is small - max ~100 over 2 years)
      let query = supabase
        .from('fragment_reveals')
        .select('*')
        .eq('user_id', user.id)
        .order('revealed_at', { ascending: true });

      // Only pull newer if we have synced before
      if (syncState.lastSyncAt) {
        query = query.gt('created_at', syncState.lastSyncAt);
      }

      const { data: remoteReveals, error: pullError } = await query;

      if (pullError) {
        result.errors.push(`Pull error: ${pullError.message}`);
      } else if (remoteReveals && remoteReveals.length > 0) {
        // Merge remote reveals into local
        const merged = await fragmentsRepo.mergeRemoteReveals(
          (remoteReveals as RemoteReveal[]).map((r) => ({
            fragment_id: r.fragment_id,
            revealed_at: r.revealed_at,
          }))
        );
        result.pulled = merged;
        
        // Count conflicts (reveals that existed locally already)
        result.conflictsResolved = remoteReveals.length - merged;
      }
    } catch (pullErr) {
      result.errors.push(`Pull exception: ${String(pullErr)}`);
    }

    // ========== PUSH ==========
    try {
      // Get local unsynced reveals
      const unsynced = await fragmentsRepo.getUnsyncedReveals();
      const syncedIds: string[] = [];

      for (const reveal of unsynced) {
        const { error: insertError } = await supabase
          .from('fragment_reveals')
          .insert({
            user_id: user.id,
            fragment_id: reveal.fragment_id,
            revealed_at: reveal.revealed_at,
          });

        if (insertError) {
          // Check if it's a uniqueness violation (23505 is Postgres unique violation)
          if (insertError.code === '23505' || insertError.message.includes('unique')) {
            // Already revealed on another device - this is expected, not an error
            result.conflictsResolved++;
            syncedIds.push(reveal.id);
          } else {
            result.errors.push(`Push error for ${reveal.fragment_id}: ${insertError.message}`);
          }
        } else {
          result.pushed++;
          syncedIds.push(reveal.id);
        }
      }

      // Mark all successful pushes (and uniqueness conflicts) as synced
      if (syncedIds.length > 0) {
        await fragmentsRepo.markRevealsSynced(syncedIds);
      }
    } catch (pushErr) {
      result.errors.push(`Push exception: ${String(pushErr)}`);
    }

    // ========== UPDATE SYNC STATE ==========
    if (result.errors.length === 0) {
      await setSyncState('fragment_reveals', syncStartTime);
    }

  } catch (err) {
    result.errors.push(`Sync exception: ${String(err)}`);
  }

  return result;
}
