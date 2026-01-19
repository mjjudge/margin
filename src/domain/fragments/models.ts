// src/domain/fragments/models.ts
// Domain models for Found Fragments feature

/**
 * Voice types for fragments.
 * Voice is never shown to users - exists only for authoring and engine weighting.
 */
export type FragmentVoice =
  | 'observer'
  | 'pattern_keeper'
  | 'naturalist'
  | 'witness';

/**
 * A fragment from the catalogue.
 * Immutable content that users read but never modify.
 */
export interface Fragment {
  id: string; // e.g., "frag_0001"
  voice: FragmentVoice;
  text: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * A record of a fragment being revealed to a user.
 * Once revealed, a fragment is never shown again to that user.
 */
export interface FragmentReveal {
  id: string; // UUID
  fragment_id: string;
  revealed_at: string;
  created_at: string;
  // Note: user_id exists in Supabase but not needed locally
  // (local DB is single-user context)
}

/**
 * Engine state snapshot for computing eligibility.
 * Pure data - no side effects.
 */
export interface FragmentEngineState {
  /** Current timestamp (ISO string) */
  now: string;
  /** Total completed practices (all time) */
  practicesCompleted: number;
  /** Timestamp of user's first completed practice */
  firstPracticeAt: string | null;
  /** Timestamp of most recent reveal */
  lastRevealAt: string | null;
  /** Number of reveals in the last 7 days */
  revealsInLast7Days: number;
  /** Count of unrevealed fragments by voice */
  unrevealedCountsByVoice: Record<FragmentVoice, number>;
}

/**
 * Result from the release engine.
 * Either a fragment to show, or null (no reveal this time).
 */
export type FragmentReleaseResult =
  | { type: 'reveal'; fragmentId: string }
  | { type: 'skip'; reason: SkipReason };

export type SkipReason =
  | 'insufficient_practices' // < 3 completed
  | 'cooldown_active' // < 48h since last reveal
  | 'weekly_cap_reached' // >= 2 in last 7 days
  | 'no_fragments_available' // all revealed or disabled
  | 'probability_gate' // random gate not passed
  | 'fragments_disabled'; // user setting
