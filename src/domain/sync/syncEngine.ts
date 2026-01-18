// src/domain/sync/syncEngine.ts
// Main sync orchestrator

import { SyncResult } from './syncTypes';
import { syncMeaningEntries } from './syncMeaningEntries';
import { syncPracticeSessions } from './syncPracticeSessions';
import { supabase } from '../../data/supabaseClient';

export interface FullSyncResult {
  success: boolean;
  results: SyncResult[];
  totalPulled: number;
  totalPushed: number;
  totalConflicts: number;
  errors: string[];
}

/**
 * Check if user is authenticated and online
 */
async function canSync(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, reason: 'Not authenticated' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `Auth check failed: ${String(err)}` };
  }
}

/**
 * Run full sync for all syncable tables.
 * Safe to call multiple times; will skip if not authenticated.
 */
export async function runFullSync(): Promise<FullSyncResult> {
  const fullResult: FullSyncResult = {
    success: false,
    results: [],
    totalPulled: 0,
    totalPushed: 0,
    totalConflicts: 0,
    errors: [],
  };

  // Check if we can sync
  const canSyncResult = await canSync();
  if (!canSyncResult.ok) {
    fullResult.errors.push(canSyncResult.reason!);
    return fullResult;
  }

  // Sync meaning entries
  const entriesResult = await syncMeaningEntries();
  fullResult.results.push(entriesResult);
  fullResult.totalPulled += entriesResult.pulled;
  fullResult.totalPushed += entriesResult.pushed;
  fullResult.totalConflicts += entriesResult.conflictsResolved;
  fullResult.errors.push(...entriesResult.errors);

  // Sync practice sessions
  const sessionsResult = await syncPracticeSessions();
  fullResult.results.push(sessionsResult);
  fullResult.totalPulled += sessionsResult.pulled;
  fullResult.totalPushed += sessionsResult.pushed;
  fullResult.totalConflicts += sessionsResult.conflictsResolved;
  fullResult.errors.push(...sessionsResult.errors);

  // Mark success if no fatal errors
  fullResult.success = fullResult.errors.length === 0;

  return fullResult;
}

/**
 * Sync only meaning entries
 */
export async function syncEntries(): Promise<SyncResult> {
  return syncMeaningEntries();
}

/**
 * Sync only practice sessions
 */
export async function syncSessions(): Promise<SyncResult> {
  return syncPracticeSessions();
}
