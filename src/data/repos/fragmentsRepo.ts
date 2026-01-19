// src/data/repos/fragmentsRepo.ts
// Repository for fragments catalogue cache and reveal history

import { getDb } from '../db';
import type {
  Fragment,
  FragmentReveal,
  FragmentVoice,
} from '../../domain/fragments/models';

// ============================================================
// Row types (SQLite representation)
// ============================================================

interface FragmentRow {
  id: string;
  voice: string;
  text: string;
  enabled: number; // SQLite boolean
  created_at: string;
  updated_at: string;
}

interface RevealRow {
  id: string;
  fragment_id: string;
  revealed_at: string;
  created_at: string;
  synced: number; // SQLite boolean
}

// ============================================================
// Row converters
// ============================================================

function rowToFragment(row: FragmentRow): Fragment {
  return {
    id: row.id,
    voice: row.voice as FragmentVoice,
    text: row.text,
    enabled: row.enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToReveal(row: RevealRow): FragmentReveal {
  return {
    id: row.id,
    fragment_id: row.fragment_id,
    revealed_at: row.revealed_at,
    created_at: row.created_at,
  };
}

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

// ============================================================
// Fragments Repo
// ============================================================

export const fragmentsRepo = {
  // ==========================================================
  // Catalogue cache methods
  // ==========================================================

  /**
   * Check if the catalogue cache has any fragments
   */
  async hasCachedCatalogue(): Promise<boolean> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM fragments_catalog_cache'
    );
    return (result?.count ?? 0) > 0;
  },

  /**
   * Get catalogue cache version from sync_state
   */
  async getCatalogueVersion(): Promise<number | null> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM sync_state WHERE key = 'fragments_catalog_version'"
    );
    return result ? parseInt(result.value, 10) : null;
  },

  /**
   * Set catalogue cache version
   */
  async setCatalogueVersion(version: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_state (key, value) VALUES ('fragments_catalog_version', ?)`,
      [version.toString()]
    );
  },

  /**
   * Replace entire catalogue cache with new data
   */
  async replaceCatalogue(fragments: Fragment[]): Promise<void> {
    const db = await getDb();

    // Clear existing cache
    await db.runAsync('DELETE FROM fragments_catalog_cache');

    // Insert all fragments
    for (const f of fragments) {
      await db.runAsync(
        `INSERT INTO fragments_catalog_cache (id, voice, text, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [f.id, f.voice, f.text, f.enabled ? 1 : 0, f.created_at, f.updated_at]
      );
    }
  },

  /**
   * Get all cached fragments
   */
  async getAllCached(): Promise<Fragment[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<FragmentRow>(
      'SELECT * FROM fragments_catalog_cache ORDER BY id'
    );
    return rows.map(rowToFragment);
  },

  /**
   * Get a single fragment by ID
   */
  async getById(id: string): Promise<Fragment | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<FragmentRow>(
      'SELECT * FROM fragments_catalog_cache WHERE id = ?',
      [id]
    );
    return row ? rowToFragment(row) : null;
  },

  /**
   * Get enabled fragments by voice
   */
  async getByVoice(voice: FragmentVoice): Promise<Fragment[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<FragmentRow>(
      'SELECT * FROM fragments_catalog_cache WHERE voice = ? AND enabled = 1 ORDER BY id',
      [voice]
    );
    return rows.map(rowToFragment);
  },

  // ==========================================================
  // Reveal methods
  // ==========================================================

  /**
   * Get all local reveals
   */
  async getAllReveals(): Promise<FragmentReveal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RevealRow>(
      'SELECT * FROM fragment_reveals_local ORDER BY revealed_at DESC'
    );
    return rows.map(rowToReveal);
  },

  /**
   * Get IDs of all revealed fragments
   */
  async getRevealedFragmentIds(): Promise<Set<string>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ fragment_id: string }>(
      'SELECT fragment_id FROM fragment_reveals_local'
    );
    return new Set(rows.map((r) => r.fragment_id));
  },

  /**
   * Get the most recent reveal
   */
  async getLastReveal(): Promise<FragmentReveal | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<RevealRow>(
      'SELECT * FROM fragment_reveals_local ORDER BY revealed_at DESC LIMIT 1'
    );
    return row ? rowToReveal(row) : null;
  },

  /**
   * Count reveals in the last N days
   */
  async countRevealsInLastDays(days: number): Promise<number> {
    const db = await getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM fragment_reveals_local WHERE revealed_at >= ?',
      [cutoff.toISOString()]
    );
    return result?.count ?? 0;
  },

  /**
   * Get unrevealed fragment counts by voice
   */
  async getUnrevealedCountsByVoice(): Promise<Record<FragmentVoice, number>> {
    // Get all revealed fragment IDs
    const revealedIds = await this.getRevealedFragmentIds();

    // Get fragments to check which are revealed
    const allFragments = await this.getAllCached();

    const counts: Record<FragmentVoice, number> = {
      observer: 0,
      pattern_keeper: 0,
      naturalist: 0,
      witness: 0,
    };

    for (const f of allFragments) {
      if (f.enabled && !revealedIds.has(f.id)) {
        counts[f.voice]++;
      }
    }

    return counts;
  },

  /**
   * Get a random unrevealed fragment for a specific voice
   */
  async getRandomUnrevealedByVoice(voice: FragmentVoice): Promise<Fragment | null> {
    const db = await getDb();

    // Get revealed IDs
    const revealedIds = await this.getRevealedFragmentIds();

    // Get all enabled fragments for this voice
    const candidates = await db.getAllAsync<FragmentRow>(
      'SELECT * FROM fragments_catalog_cache WHERE voice = ? AND enabled = 1',
      [voice]
    );

    // Filter out revealed ones
    const unrevealed = candidates.filter((c) => !revealedIds.has(c.id));

    if (unrevealed.length === 0) return null;

    // Pick random one
    const index = Math.floor(Math.random() * unrevealed.length);
    return rowToFragment(unrevealed[index]);
  },

  /**
   * Mark a fragment as revealed locally
   */
  async markRevealed(fragmentId: string, revealedAt?: string): Promise<FragmentReveal> {
    const db = await getDb();
    const now = nowISO();
    const reveal: FragmentReveal = {
      id: generateId(),
      fragment_id: fragmentId,
      revealed_at: revealedAt ?? now,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO fragment_reveals_local (id, fragment_id, revealed_at, created_at, synced)
       VALUES (?, ?, ?, ?, 0)`,
      [reveal.id, reveal.fragment_id, reveal.revealed_at, reveal.created_at]
    );

    return reveal;
  },

  /**
   * Check if a fragment has been revealed
   */
  async isRevealed(fragmentId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM fragment_reveals_local WHERE fragment_id = ?',
      [fragmentId]
    );
    return (result?.count ?? 0) > 0;
  },

  /**
   * Get unsynced reveals (for push to Supabase)
   */
  async getUnsyncedReveals(): Promise<FragmentReveal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<RevealRow>(
      'SELECT * FROM fragment_reveals_local WHERE synced = 0'
    );
    return rows.map(rowToReveal);
  },

  /**
   * Mark reveals as synced
   */
  async markRevealsSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDb();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE fragment_reveals_local SET synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  },

  /**
   * Merge reveals from remote (for pull from Supabase)
   * Inserts only if not already present (by fragment_id)
   */
  async mergeRemoteReveals(
    reveals: Array<{ fragment_id: string; revealed_at: string }>
  ): Promise<number> {
    const db = await getDb();
    let merged = 0;

    for (const r of reveals) {
      // Check if already exists
      const exists = await this.isRevealed(r.fragment_id);
      if (!exists) {
        const now = nowISO();
        await db.runAsync(
          `INSERT INTO fragment_reveals_local (id, fragment_id, revealed_at, created_at, synced)
           VALUES (?, ?, ?, ?, 1)`,
          [generateId(), r.fragment_id, r.revealed_at, now]
        );
        merged++;
      }
    }

    return merged;
  },

  /**
   * Delete all reveals (for testing/reset)
   */
  async clearReveals(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM fragment_reveals_local');
  },

  /**
   * Delete a specific reveal (for conflict resolution)
   */
  async deleteReveal(fragmentId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'DELETE FROM fragment_reveals_local WHERE fragment_id = ?',
      [fragmentId]
    );
  },
};
