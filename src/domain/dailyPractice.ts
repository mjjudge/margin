// src/domain/dailyPractice.ts
// Deterministic daily practice selection
// Rules:
// - One practice per calendar day
// - Stable within the same day (same date = same practice)
// - Swap allowed once per day (stored in local state)
// - No streaks or progress tracking

import { practicesRepo } from '../data/repos/practicesRepo';
import type { Practice } from './models';

/**
 * Generate a deterministic hash from a date string
 * This ensures the same date always produces the same number
 */
function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get today's date as YYYY-MM-DD string (local timezone)
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Select a practice deterministically based on the date
 * Same date = same practice (unless swapped)
 */
export async function selectPracticeForDate(dateStr: string): Promise<Practice | null> {
  const practices = await practicesRepo.getAll();
  
  if (practices.length === 0) {
    return null;
  }
  
  const hash = hashDate(dateStr);
  const index = hash % practices.length;
  
  return practices[index];
}

/**
 * Get today's practice (deterministic)
 */
export async function getTodaysPractice(): Promise<Practice | null> {
  return selectPracticeForDate(getTodayDateStr());
}

/**
 * Get an alternative practice for swapping
 * Returns a different practice than the current one
 */
export async function getSwapAlternative(currentPracticeId: string): Promise<Practice | null> {
  const practices = await practicesRepo.getAll();
  
  if (practices.length <= 1) {
    return null; // Can't swap if only one practice
  }
  
  // Find a different practice using date + offset
  const dateStr = getTodayDateStr();
  const hash = hashDate(dateStr + '-swap');
  
  // Filter out current practice and select from remaining
  const alternatives = practices.filter(p => p.id !== currentPracticeId);
  const index = hash % alternatives.length;
  
  return alternatives[index];
}

// --- Swap state management (in-memory for now, persisted via sync_state later) ---

let swappedPracticeId: string | null = null;
let swapDate: string | null = null;

/**
 * Check if swap has been used today
 */
export function hasSwappedToday(): boolean {
  return swapDate === getTodayDateStr() && swappedPracticeId !== null;
}

/**
 * Get the swapped practice ID if swapped today
 */
export function getSwappedPracticeId(): string | null {
  if (swapDate === getTodayDateStr()) {
    return swappedPracticeId;
  }
  return null;
}

/**
 * Set the swapped practice for today
 */
export function setSwappedPractice(practiceId: string): void {
  swappedPracticeId = practiceId;
  swapDate = getTodayDateStr();
}

/**
 * Clear swap state (for testing or new day)
 */
export function clearSwapState(): void {
  swappedPracticeId = null;
  swapDate = null;
}

/**
 * Get today's practice, accounting for swaps
 */
export async function getTodaysPracticeWithSwap(): Promise<Practice | null> {
  const swappedId = getSwappedPracticeId();
  
  if (swappedId) {
    const swapped = await practicesRepo.getById(swappedId);
    if (swapped) {
      return swapped;
    }
  }
  
  return getTodaysPractice();
}
