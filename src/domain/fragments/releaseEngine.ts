// src/domain/fragments/releaseEngine.ts
// Pure, deterministic fragment release engine.
// No side effects, no I/O - just computes whether a fragment should be released.

import type {
  FragmentEngineState,
  FragmentReleaseResult,
  FragmentVoice,
  SkipReason,
} from './models';

// ============================================================
// Configuration constants
// ============================================================

/** Minimum completed practices before fragments can appear */
export const MIN_PRACTICES = 3;

/** Cooldown period in milliseconds (48 hours) */
export const COOLDOWN_MS = 48 * 60 * 60 * 1000;

/** Maximum reveals per rolling 7-day window */
export const MAX_REVEALS_PER_WEEK = 2;

/**
 * Base probability of showing a fragment when all gates pass.
 * ~0.18 yields roughly 2 reveals per week with daily practice.
 */
export const BASE_PROBABILITY = 0.18;

/**
 * Voice weights by age bucket (weeks since first practice).
 * Each bucket sums to 1.0.
 */
export const VOICE_WEIGHTS: Record<string, Record<FragmentVoice, number>> = {
  // First 8 weeks: mostly observer
  '0-8': {
    observer: 0.5,
    pattern_keeper: 0.2,
    naturalist: 0.2,
    witness: 0.1,
  },
  // Weeks 9-26: balanced
  '9-26': {
    observer: 0.3,
    pattern_keeper: 0.3,
    naturalist: 0.2,
    witness: 0.2,
  },
  // Weeks 27-52: shifting toward depth
  '27-52': {
    observer: 0.2,
    pattern_keeper: 0.3,
    naturalist: 0.25,
    witness: 0.25,
  },
  // After year 1: full depth
  '53+': {
    observer: 0.15,
    pattern_keeper: 0.25,
    naturalist: 0.3,
    witness: 0.3,
  },
};

// ============================================================
// Helper functions
// ============================================================

/**
 * Get the age bucket key based on weeks since first practice.
 */
export function getAgeBucket(weeksSinceFirst: number): string {
  if (weeksSinceFirst <= 8) return '0-8';
  if (weeksSinceFirst <= 26) return '9-26';
  if (weeksSinceFirst <= 52) return '27-52';
  return '53+';
}

/**
 * Calculate weeks between two ISO timestamps.
 */
export function weeksBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / msPerWeek);
}

/**
 * Check if cooldown period has passed.
 */
export function isCooldownComplete(
  lastRevealAt: string | null,
  now: string
): boolean {
  if (!lastRevealAt) return true;
  const lastMs = new Date(lastRevealAt).getTime();
  const nowMs = new Date(now).getTime();
  return nowMs - lastMs >= COOLDOWN_MS;
}

/**
 * Skip result helper.
 */
function skip(reason: SkipReason): FragmentReleaseResult {
  return { type: 'skip', reason };
}

// ============================================================
// Main engine
// ============================================================

/**
 * Determine if a fragment should be released.
 *
 * This is a pure function - given the same inputs, it will always
 * produce the same output. The random gate uses a provided seed value.
 *
 * @param state - Current engine state snapshot
 * @param randomValue - A value in [0, 1) for the probability gate
 * @param fragmentsEnabled - Whether user has fragments enabled (default true)
 * @returns FragmentReleaseResult
 */
export function shouldRelease(
  state: FragmentEngineState,
  randomValue: number,
  fragmentsEnabled: boolean = true
): FragmentReleaseResult {
  // Gate 0: User setting
  if (!fragmentsEnabled) {
    return skip('fragments_disabled');
  }

  // Gate 1: Minimum practices
  if (state.practicesCompleted < MIN_PRACTICES) {
    return skip('insufficient_practices');
  }

  // Gate 2: Cooldown (48h since last reveal)
  if (!isCooldownComplete(state.lastRevealAt, state.now)) {
    return skip('cooldown_active');
  }

  // Gate 3: Weekly cap (max 2 per 7 days)
  if (state.revealsInLast7Days >= MAX_REVEALS_PER_WEEK) {
    return skip('weekly_cap_reached');
  }

  // Gate 4: Check if any fragments available
  const totalUnrevealed = Object.values(state.unrevealedCountsByVoice).reduce(
    (sum, count) => sum + count,
    0
  );
  if (totalUnrevealed === 0) {
    return skip('no_fragments_available');
  }

  // Gate 5: Probability gate
  if (randomValue >= BASE_PROBABILITY) {
    return skip('probability_gate');
  }

  // All gates passed - select a fragment
  const fragmentId = selectFragment(state, randomValue);
  if (!fragmentId) {
    return skip('no_fragments_available');
  }

  return { type: 'reveal', fragmentId };
}

/**
 * Select which fragment to reveal based on voice weights and availability.
 *
 * @param state - Engine state with unrevealed counts
 * @param randomValue - Random value for weighted selection
 * @returns Fragment ID or null
 */
export function selectFragment(
  state: FragmentEngineState,
  randomValue: number
): string | null {
  // Determine age bucket
  const weeksSinceFirst = state.firstPracticeAt
    ? weeksBetween(state.firstPracticeAt, state.now)
    : 0;
  const bucket = getAgeBucket(weeksSinceFirst);
  const weights = VOICE_WEIGHTS[bucket];

  // Select voice based on weighted random and availability
  const voice = selectVoice(weights, state.unrevealedCountsByVoice, randomValue);
  if (!voice) return null;

  // The actual fragment selection from the chosen voice pool
  // is delegated to the repo (we return null here; repo handles it)
  // This function returns the voice for the repo to use
  return voice;
}

/**
 * Select a voice based on weights, filtered by availability.
 *
 * @param weights - Base weights by voice
 * @param availableCounts - Count of unrevealed fragments per voice
 * @param randomValue - Random value in [0, 1)
 * @returns Selected voice or null
 */
export function selectVoice(
  weights: Record<FragmentVoice, number>,
  availableCounts: Record<FragmentVoice, number>,
  randomValue: number
): FragmentVoice | null {
  // Filter to voices with available fragments
  const voices: FragmentVoice[] = ['observer', 'pattern_keeper', 'naturalist', 'witness'];
  const available = voices.filter((v) => availableCounts[v] > 0);

  if (available.length === 0) return null;

  // Renormalize weights for available voices
  const totalWeight = available.reduce((sum, v) => sum + weights[v], 0);
  if (totalWeight === 0) return null;

  // Weighted selection
  const normalized = randomValue * totalWeight;
  let cumulative = 0;

  for (const voice of available) {
    cumulative += weights[voice];
    if (normalized < cumulative) {
      return voice;
    }
  }

  // Fallback to last available (shouldn't happen with correct math)
  return available[available.length - 1];
}

/**
 * Validate that voice weights sum to 1 for each bucket.
 * Used in tests to ensure config integrity.
 */
export function validateWeights(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const tolerance = 0.0001;

  for (const [bucket, weights] of Object.entries(VOICE_WEIGHTS)) {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > tolerance) {
      errors.push(`Bucket "${bucket}" weights sum to ${sum}, expected 1.0`);
    }
  }

  return { valid: errors.length === 0, errors };
}
