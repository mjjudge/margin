// src/data/seedFragments.ts
// Seeds fragments catalogue from local JSON (offline fallback) or refreshes from Supabase

import { fragmentsRepo } from './repos/fragmentsRepo';
import type { Fragment, FragmentVoice } from '../domain/fragments/models';

// Local seed data for offline-first bootstrapping
import fragmentsSeed from '../content/fragments.seed.json';

/**
 * Check if the local fragments cache needs seeding
 */
export async function needsFragmentsSeeding(): Promise<boolean> {
  return !(await fragmentsRepo.hasCachedCatalogue());
}

/**
 * Seed fragments catalogue from local JSON file.
 * Used for offline-first bootstrap when no cache exists.
 */
export async function seedFragmentsFromLocal(): Promise<{ seeded: number }> {
  const fragments: Fragment[] = fragmentsSeed.fragments.map((f) => ({
    id: f.id,
    voice: f.voice as FragmentVoice,
    text: f.text,
    enabled: f.enabled,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  await fragmentsRepo.replaceCatalogue(fragments);
  await fragmentsRepo.setCatalogueVersion(fragmentsSeed.version);

  return { seeded: fragments.length };
}

/**
 * Get the local seed version (for comparison with remote)
 */
export function getLocalSeedVersion(): number {
  return fragmentsSeed.version;
}
