// src/data/seedPractices.ts
// Idempotent seeding of practices from practices.seed.json

import { practicesRepo } from './repos/practicesRepo';
import type { Practice } from '../domain/models';
import practicesSeed from '../content/practices.seed.json';

/**
 * Seed practices into SQLite from practices.seed.json
 * Idempotent: uses upsert, safe to call multiple times
 */
export async function seedPractices(): Promise<{ seeded: number; total: number }> {
  const practices = practicesSeed as Practice[];
  
  for (const practice of practices) {
    await practicesRepo.upsert(practice);
  }
  
  const total = await practicesRepo.count();
  
  return {
    seeded: practices.length,
    total,
  };
}

/**
 * Check if practices need seeding (count is 0)
 */
export async function needsSeeding(): Promise<boolean> {
  const count = await practicesRepo.count();
  return count === 0;
}
