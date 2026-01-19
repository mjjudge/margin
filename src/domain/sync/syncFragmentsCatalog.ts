// src/domain/sync/syncFragmentsCatalog.ts
// One-way sync for fragments_catalog table (pull only)
// 
// The catalogue is global content - users read but never write.
// This module refreshes the local cache from Supabase.

import { SyncResult } from './syncTypes';
import { supabase } from '../../data/supabaseClient';
import { fragmentsRepo } from '../../data/repos/fragmentsRepo';
import { getLocalSeedVersion } from '../../data/seedFragments';
import type { Fragment, FragmentVoice } from '../fragments/models';

interface RemoteFragment {
  id: string;
  voice: string;
  text: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Sync fragments catalogue from Supabase to local cache.
 * 
 * Strategy:
 * 1. Check if local cache version differs from remote
 * 2. If different (or no local cache), pull full catalogue
 * 3. Replace local cache entirely
 * 
 * This is read-only sync - users cannot modify the catalogue.
 */
export async function syncFragmentsCatalog(): Promise<SyncResult> {
  const result: SyncResult = {
    table: 'fragments_catalog',
    pulled: 0,
    pushed: 0, // Always 0 - read-only
    conflictsResolved: 0, // Always 0 - no conflicts possible
    errors: [],
  };

  try {
    // Get current user (authentication required even for read)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      result.errors.push('Not authenticated');
      return result;
    }

    // Check local cache version
    const localVersion = await fragmentsRepo.getCatalogueVersion();
    
    // For now, use local seed version as "remote version"
    // In future, could store version in a Supabase config table
    const remoteVersion = getLocalSeedVersion();

    // Skip if already at current version
    if (localVersion !== null && localVersion >= remoteVersion) {
      return result;
    }

    // ========== PULL ==========
    try {
      const { data: remoteFragments, error: pullError } = await supabase
        .from('fragments_catalog')
        .select('*')
        .eq('enabled', true)
        .order('id', { ascending: true });

      if (pullError) {
        result.errors.push(`Pull error: ${pullError.message}`);
        return result;
      }

      if (!remoteFragments || remoteFragments.length === 0) {
        // No fragments in remote - this might be expected during migration
        // Keep local cache as-is
        return result;
      }

      // Convert remote format to local format
      const fragments: Fragment[] = (remoteFragments as RemoteFragment[]).map((r) => ({
        id: r.id,
        voice: r.voice as FragmentVoice,
        text: r.text,
        enabled: r.enabled,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      // Replace entire local cache
      await fragmentsRepo.replaceCatalogue(fragments);
      await fragmentsRepo.setCatalogueVersion(remoteVersion);

      result.pulled = fragments.length;

    } catch (pullErr) {
      result.errors.push(`Pull exception: ${String(pullErr)}`);
    }

  } catch (err) {
    result.errors.push(`Sync exception: ${String(err)}`);
  }

  return result;
}

/**
 * Force refresh the catalogue cache (ignores version check)
 */
export async function forceRefreshCatalog(): Promise<SyncResult> {
  // Clear version to force refresh
  await fragmentsRepo.setCatalogueVersion(0);
  return syncFragmentsCatalog();
}
