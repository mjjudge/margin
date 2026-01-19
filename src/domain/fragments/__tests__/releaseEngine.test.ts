// src/domain/fragments/__tests__/releaseEngine.test.ts
// Unit tests for fragment release engine

import {
  shouldRelease,
  selectVoice,
  validateWeights,
  getAgeBucket,
  weeksBetween,
  isCooldownComplete,
  MIN_PRACTICES,
  COOLDOWN_MS,
  MAX_REVEALS_PER_WEEK,
  BASE_PROBABILITY,
  VOICE_WEIGHTS,
} from '../releaseEngine';
import type { FragmentEngineState, FragmentVoice } from '../models';

// ============================================================
// Helper to create test state
// ============================================================

function makeState(overrides: Partial<FragmentEngineState> = {}): FragmentEngineState {
  return {
    now: '2025-06-15T12:00:00.000Z',
    practicesCompleted: 10,
    firstPracticeAt: '2025-01-01T12:00:00.000Z',
    lastRevealAt: null,
    revealsInLast7Days: 0,
    unrevealedCountsByVoice: {
      observer: 27,
      pattern_keeper: 28,
      naturalist: 23,
      witness: 22,
    },
    ...overrides,
  };
}

// ============================================================
// Config validation tests
// ============================================================

describe('validateWeights', () => {
  it('should have valid weights that sum to 1 for each bucket', () => {
    const result = validateWeights();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should have weights for all expected buckets', () => {
    expect(Object.keys(VOICE_WEIGHTS)).toEqual(['0-8', '9-26', '27-52', '53+']);
  });

  it('should have weights for all voices in each bucket', () => {
    const voices: FragmentVoice[] = ['observer', 'pattern_keeper', 'naturalist', 'witness'];
    for (const weights of Object.values(VOICE_WEIGHTS)) {
      for (const voice of voices) {
        expect(weights[voice]).toBeGreaterThanOrEqual(0);
        expect(weights[voice]).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ============================================================
// Age bucket tests
// ============================================================

describe('getAgeBucket', () => {
  it('should return 0-8 for first 8 weeks', () => {
    expect(getAgeBucket(0)).toBe('0-8');
    expect(getAgeBucket(4)).toBe('0-8');
    expect(getAgeBucket(8)).toBe('0-8');
  });

  it('should return 9-26 for weeks 9-26', () => {
    expect(getAgeBucket(9)).toBe('9-26');
    expect(getAgeBucket(15)).toBe('9-26');
    expect(getAgeBucket(26)).toBe('9-26');
  });

  it('should return 27-52 for weeks 27-52', () => {
    expect(getAgeBucket(27)).toBe('27-52');
    expect(getAgeBucket(40)).toBe('27-52');
    expect(getAgeBucket(52)).toBe('27-52');
  });

  it('should return 53+ for weeks after 52', () => {
    expect(getAgeBucket(53)).toBe('53+');
    expect(getAgeBucket(100)).toBe('53+');
    expect(getAgeBucket(200)).toBe('53+');
  });
});

// ============================================================
// Time calculation tests
// ============================================================

describe('weeksBetween', () => {
  it('should calculate weeks correctly', () => {
    expect(weeksBetween('2025-01-01T00:00:00Z', '2025-01-08T00:00:00Z')).toBe(1);
    expect(weeksBetween('2025-01-01T00:00:00Z', '2025-01-15T00:00:00Z')).toBe(2);
    expect(weeksBetween('2025-01-01T00:00:00Z', '2025-02-01T00:00:00Z')).toBe(4);
  });

  it('should floor partial weeks', () => {
    expect(weeksBetween('2025-01-01T00:00:00Z', '2025-01-05T00:00:00Z')).toBe(0);
    expect(weeksBetween('2025-01-01T00:00:00Z', '2025-01-10T00:00:00Z')).toBe(1);
  });
});

describe('isCooldownComplete', () => {
  it('should return true when no previous reveal', () => {
    expect(isCooldownComplete(null, '2025-06-15T12:00:00Z')).toBe(true);
  });

  it('should return false when within 48h of last reveal', () => {
    const lastReveal = '2025-06-14T12:00:00Z';
    const now = '2025-06-15T12:00:00Z'; // 24h later
    expect(isCooldownComplete(lastReveal, now)).toBe(false);
  });

  it('should return true when exactly 48h after last reveal', () => {
    const lastReveal = '2025-06-13T12:00:00Z';
    const now = '2025-06-15T12:00:00Z'; // 48h later
    expect(isCooldownComplete(lastReveal, now)).toBe(true);
  });

  it('should return true when more than 48h after last reveal', () => {
    const lastReveal = '2025-06-10T12:00:00Z';
    const now = '2025-06-15T12:00:00Z'; // 5 days later
    expect(isCooldownComplete(lastReveal, now)).toBe(true);
  });
});

// ============================================================
// Gate tests
// ============================================================

describe('shouldRelease - gates', () => {
  it('should skip if fragments disabled', () => {
    const state = makeState();
    const result = shouldRelease(state, 0.1, false);
    expect(result).toEqual({ type: 'skip', reason: 'fragments_disabled' });
  });

  it('should skip if insufficient practices', () => {
    const state = makeState({ practicesCompleted: 2 });
    const result = shouldRelease(state, 0.1);
    expect(result).toEqual({ type: 'skip', reason: 'insufficient_practices' });
  });

  it('should skip if cooldown active', () => {
    const state = makeState({
      now: '2025-06-15T12:00:00.000Z',
      lastRevealAt: '2025-06-14T12:00:00.000Z', // 24h ago
    });
    const result = shouldRelease(state, 0.1);
    expect(result).toEqual({ type: 'skip', reason: 'cooldown_active' });
  });

  it('should skip if weekly cap reached', () => {
    const state = makeState({ revealsInLast7Days: 2 });
    const result = shouldRelease(state, 0.1);
    expect(result).toEqual({ type: 'skip', reason: 'weekly_cap_reached' });
  });

  it('should skip if no fragments available', () => {
    const state = makeState({
      unrevealedCountsByVoice: {
        observer: 0,
        pattern_keeper: 0,
        naturalist: 0,
        witness: 0,
      },
    });
    const result = shouldRelease(state, 0.1);
    expect(result).toEqual({ type: 'skip', reason: 'no_fragments_available' });
  });

  it('should skip if probability gate not passed', () => {
    const state = makeState();
    // randomValue >= BASE_PROBABILITY should fail the gate
    const result = shouldRelease(state, 0.5);
    expect(result).toEqual({ type: 'skip', reason: 'probability_gate' });
  });

  it('should reveal when all gates pass', () => {
    const state = makeState();
    // randomValue < BASE_PROBABILITY should pass the gate
    const result = shouldRelease(state, 0.05);
    expect(result.type).toBe('reveal');
  });
});

// ============================================================
// Voice selection tests
// ============================================================

describe('selectVoice', () => {
  const baseWeights: Record<FragmentVoice, number> = {
    observer: 0.5,
    pattern_keeper: 0.2,
    naturalist: 0.2,
    witness: 0.1,
  };

  const fullAvailability: Record<FragmentVoice, number> = {
    observer: 10,
    pattern_keeper: 10,
    naturalist: 10,
    witness: 10,
  };

  it('should return null when no fragments available', () => {
    const empty = { observer: 0, pattern_keeper: 0, naturalist: 0, witness: 0 };
    expect(selectVoice(baseWeights, empty, 0.5)).toBeNull();
  });

  it('should select the only available voice', () => {
    const onlyObserver = { observer: 5, pattern_keeper: 0, naturalist: 0, witness: 0 };
    expect(selectVoice(baseWeights, onlyObserver, 0.5)).toBe('observer');
    expect(selectVoice(baseWeights, onlyObserver, 0.99)).toBe('observer');
  });

  it('should respect weights for voice selection', () => {
    // With low random value, should select higher-weighted voice
    const result1 = selectVoice(baseWeights, fullAvailability, 0.1);
    expect(result1).toBe('observer'); // observer has 0.5 weight

    // With higher random value, should select later voices
    const result2 = selectVoice(baseWeights, fullAvailability, 0.9);
    expect(['naturalist', 'witness']).toContain(result2);
  });

  it('should skip unavailable voices in weighted selection', () => {
    const noObserver = { observer: 0, pattern_keeper: 10, naturalist: 10, witness: 10 };
    // Even with low random, should not select observer (unavailable)
    const result = selectVoice(baseWeights, noObserver, 0.05);
    expect(result).not.toBe('observer');
    expect(['pattern_keeper', 'naturalist', 'witness']).toContain(result);
  });
});

// ============================================================
// Determinism tests
// ============================================================

describe('determinism', () => {
  it('should produce same result with same inputs', () => {
    const state = makeState();
    const randomValue = 0.1;

    const result1 = shouldRelease(state, randomValue);
    const result2 = shouldRelease(state, randomValue);

    expect(result1).toEqual(result2);
  });

  it('should produce different results with different random values', () => {
    const state = makeState();

    const resultPass = shouldRelease(state, 0.05); // < BASE_PROBABILITY
    const resultFail = shouldRelease(state, 0.5); // >= BASE_PROBABILITY

    expect(resultPass.type).toBe('reveal');
    expect(resultFail.type).toBe('skip');
  });
});

// ============================================================
// Edge case tests
// ============================================================

describe('edge cases', () => {
  it('should handle exactly MIN_PRACTICES', () => {
    const state = makeState({ practicesCompleted: MIN_PRACTICES });
    const result = shouldRelease(state, 0.05);
    expect(result.type).toBe('reveal');
  });

  it('should handle exactly MAX_REVEALS_PER_WEEK - 1', () => {
    const state = makeState({ revealsInLast7Days: MAX_REVEALS_PER_WEEK - 1 });
    const result = shouldRelease(state, 0.05);
    expect(result.type).toBe('reveal');
  });

  it('should handle exactly MAX_REVEALS_PER_WEEK', () => {
    const state = makeState({ revealsInLast7Days: MAX_REVEALS_PER_WEEK });
    const result = shouldRelease(state, 0.05);
    expect(result).toEqual({ type: 'skip', reason: 'weekly_cap_reached' });
  });

  it('should handle first practice at same time as now', () => {
    const now = '2025-06-15T12:00:00.000Z';
    const state = makeState({
      now,
      firstPracticeAt: now,
      practicesCompleted: 3,
    });
    const result = shouldRelease(state, 0.05);
    expect(result.type).toBe('reveal');
  });

  it('should handle null firstPracticeAt (uses week 0 bucket)', () => {
    const state = makeState({
      firstPracticeAt: null,
      practicesCompleted: 3,
    });
    const result = shouldRelease(state, 0.05);
    // Should still work, using 0-8 bucket
    expect(result.type).toBe('reveal');
  });
});

// ============================================================
// Constants sanity checks
// ============================================================

describe('constants', () => {
  it('should have reasonable MIN_PRACTICES', () => {
    expect(MIN_PRACTICES).toBeGreaterThanOrEqual(1);
    expect(MIN_PRACTICES).toBeLessThanOrEqual(10);
  });

  it('should have 48h cooldown', () => {
    expect(COOLDOWN_MS).toBe(48 * 60 * 60 * 1000);
  });

  it('should have max 2 reveals per week', () => {
    expect(MAX_REVEALS_PER_WEEK).toBe(2);
  });

  it('should have BASE_PROBABILITY around 0.18', () => {
    expect(BASE_PROBABILITY).toBeGreaterThanOrEqual(0.1);
    expect(BASE_PROBABILITY).toBeLessThanOrEqual(0.3);
  });
});
