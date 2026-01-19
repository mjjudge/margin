// src/ui/hooks/useFragment.ts
// Hook to manage fragment display logic on screens.
// Handles: eligibility check, fragment selection, reveal recording, dismissal.

import { useState, useCallback } from 'react';
import { fragmentsRepo } from '../../data/repos/fragmentsRepo';
import { sessionsRepo } from '../../data/repos/sessionsRepo';
import {
  shouldRelease,
  selectVoice,
  VOICE_WEIGHTS,
  getAgeBucket,
  weeksBetween,
} from '../../domain/fragments/releaseEngine';
import type {
  Fragment,
  FragmentEngineState,
} from '../../domain/fragments/models';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FRAGMENTS_ENABLED_KEY = 'margin:fragments_enabled';
const FIRST_PRACTICE_KEY = 'margin:first_practice_at';

interface UseFragmentResult {
  /** The current fragment to display, or null */
  fragment: Fragment | null;
  /** Whether we're loading/checking eligibility */
  loading: boolean;
  /** Dismiss the current fragment (records reveal) */
  dismiss: () => Promise<void>;
  /** Check for a new fragment (call after practice completion) */
  checkForFragment: () => Promise<void>;
}

/**
 * Hook to manage Found Fragments display.
 * 
 * Usage:
 * - Call on HomeScreen or PostPracticeScreen
 * - `fragment` will be non-null when one should be shown
 * - Call `dismiss()` when user taps to continue
 * - Call `checkForFragment()` after practice completion
 */
export function useFragment(): UseFragmentResult {
  const [fragment, setFragment] = useState<Fragment | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Build engine state from local data
   */
  const buildEngineState = useCallback(async (): Promise<FragmentEngineState> => {
    const now = new Date().toISOString();
    
    // Count completed practices
    const practicesCompleted = await sessionsRepo.countCompleted();
    
    // Get first practice timestamp
    let firstPracticeAt: string | null = null;
    try {
      firstPracticeAt = await AsyncStorage.getItem(FIRST_PRACTICE_KEY);
      
      // If not stored but we have practices, find the earliest
      if (!firstPracticeAt && practicesCompleted > 0) {
        const allSessions = await sessionsRepo.getAll();
        const completed = allSessions.filter(s => s.status === 'completed');
        if (completed.length > 0) {
          // Sort by started_at ascending
          completed.sort((a, b) => 
            new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
          );
          firstPracticeAt = completed[0].started_at;
          await AsyncStorage.setItem(FIRST_PRACTICE_KEY, firstPracticeAt);
        }
      }
    } catch (err) {
      console.warn('[useFragment] Failed to get first practice:', err);
    }
    
    // Get last reveal timestamp
    const lastReveal = await fragmentsRepo.getLastReveal();
    const lastRevealAt = lastReveal?.revealed_at ?? null;
    
    // Count reveals in last 7 days
    const revealsInLast7Days = await fragmentsRepo.countRevealsInLastDays(7);
    
    // Get unrevealed counts by voice
    const unrevealedCountsByVoice = await fragmentsRepo.getUnrevealedCountsByVoice();
    
    return {
      now,
      practicesCompleted,
      firstPracticeAt,
      lastRevealAt,
      revealsInLast7Days,
      unrevealedCountsByVoice,
    };
  }, []);

  /**
   * Check if fragments are enabled in settings
   */
  const areFragmentsEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(FRAGMENTS_ENABLED_KEY);
      // Default to enabled if not set
      return value !== 'false';
    } catch {
      return true;
    }
  }, []);

  /**
   * Check eligibility and potentially select a fragment
   */
  const checkForFragment = useCallback(async () => {
    setLoading(true);
    try {
      // Check user setting
      const enabled = await areFragmentsEnabled();
      if (!enabled) {
        setFragment(null);
        return;
      }

      // Build state
      const state = await buildEngineState();
      
      // Generate random value for probability gate
      const randomValue = Math.random();
      
      // Check release eligibility
      const result = shouldRelease(state, randomValue, enabled);
      
      if (result.type === 'skip') {
        // No fragment this time
        setFragment(null);
        return;
      }
      
      // We passed all gates - select a fragment
      // Get voice based on age bucket and availability
      const weeksSinceFirst = state.firstPracticeAt
        ? weeksBetween(state.firstPracticeAt, state.now)
        : 0;
      const bucket = getAgeBucket(weeksSinceFirst);
      const weights = VOICE_WEIGHTS[bucket];
      
      const selectedVoice = selectVoice(
        weights,
        state.unrevealedCountsByVoice,
        Math.random() // new random for voice selection
      );
      
      if (!selectedVoice) {
        setFragment(null);
        return;
      }
      
      // Get a random unrevealed fragment from this voice
      const selectedFragment = await fragmentsRepo.getRandomUnrevealedByVoice(selectedVoice);
      
      if (selectedFragment) {
        setFragment(selectedFragment);
      }
    } catch (err) {
      console.error('[useFragment] Error checking for fragment:', err);
      setFragment(null);
    } finally {
      setLoading(false);
    }
  }, [buildEngineState, areFragmentsEnabled]);

  /**
   * Dismiss the current fragment (user tapped to continue)
   */
  const dismiss = useCallback(async () => {
    if (!fragment) return;
    
    try {
      // Record the reveal
      await fragmentsRepo.markRevealed(fragment.id);
    } catch (err) {
      console.error('[useFragment] Error recording reveal:', err);
    }
    
    // Clear from state
    setFragment(null);
  }, [fragment]);

  return {
    fragment,
    loading,
    dismiss,
    checkForFragment,
  };
}

/**
 * Set whether fragments are enabled (for Settings screen)
 */
export async function setFragmentsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(FRAGMENTS_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Get whether fragments are enabled (for Settings screen)
 */
export async function getFragmentsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(FRAGMENTS_ENABLED_KEY);
    return value !== 'false';
  } catch {
    return true;
  }
}
