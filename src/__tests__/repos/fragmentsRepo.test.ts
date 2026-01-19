// src/__tests__/repos/fragmentsRepo.test.ts
// Tests for fragments repository

import { fragmentsRepo } from '../../data/repos/fragmentsRepo';
import type { Fragment, FragmentVoice } from '../../domain/fragments/models';

// Access mock helpers
const expoSqlite = jest.requireMock('expo-sqlite') as {
  __resetMock: () => void;
};

// ============================================================
// Test setup
// ============================================================

beforeEach(() => {
  // Reset mock state for clean tests
  expoSqlite.__resetMock();
});

// Helper to create test fragments
function makeFragment(id: string, voice: FragmentVoice = 'observer'): Fragment {
  return {
    id,
    voice,
    text: `Test fragment ${id}`,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================
// Catalogue cache tests
// ============================================================

describe('fragmentsRepo - catalogue cache', () => {
  it('should report empty cache initially', async () => {
    const hasCatalogue = await fragmentsRepo.hasCachedCatalogue();
    expect(hasCatalogue).toBe(false);
  });

  it('should store and retrieve fragments', async () => {
    const fragments = [
      makeFragment('frag_001', 'observer'),
      makeFragment('frag_002', 'pattern_keeper'),
      makeFragment('frag_003', 'naturalist'),
    ];

    await fragmentsRepo.replaceCatalogue(fragments);

    const hasCatalogue = await fragmentsRepo.hasCachedCatalogue();
    expect(hasCatalogue).toBe(true);

    const all = await fragmentsRepo.getAllCached();
    expect(all).toHaveLength(3);
  });

  it('should get fragment by ID', async () => {
    const fragments = [makeFragment('frag_001')];
    await fragmentsRepo.replaceCatalogue(fragments);

    const found = await fragmentsRepo.getById('frag_001');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('frag_001');

    const notFound = await fragmentsRepo.getById('frag_999');
    expect(notFound).toBeNull();
  });

  it('should get fragments by voice', async () => {
    const fragments = [
      makeFragment('frag_001', 'observer'),
      makeFragment('frag_002', 'observer'),
      makeFragment('frag_003', 'witness'),
    ];
    await fragmentsRepo.replaceCatalogue(fragments);

    const observers = await fragmentsRepo.getByVoice('observer');
    expect(observers).toHaveLength(2);

    const witnesses = await fragmentsRepo.getByVoice('witness');
    expect(witnesses).toHaveLength(1);

    const naturalists = await fragmentsRepo.getByVoice('naturalist');
    expect(naturalists).toHaveLength(0);
  });

  it('should track catalogue version', async () => {
    const initialVersion = await fragmentsRepo.getCatalogueVersion();
    expect(initialVersion).toBeNull();

    await fragmentsRepo.setCatalogueVersion(1);
    const version1 = await fragmentsRepo.getCatalogueVersion();
    expect(version1).toBe(1);

    await fragmentsRepo.setCatalogueVersion(2);
    const version2 = await fragmentsRepo.getCatalogueVersion();
    expect(version2).toBe(2);
  });

  it('should replace catalogue entirely', async () => {
    // First set
    await fragmentsRepo.replaceCatalogue([
      makeFragment('frag_001'),
      makeFragment('frag_002'),
    ]);
    expect(await fragmentsRepo.getAllCached()).toHaveLength(2);

    // Replace with new set
    await fragmentsRepo.replaceCatalogue([
      makeFragment('frag_003'),
    ]);
    expect(await fragmentsRepo.getAllCached()).toHaveLength(1);

    const first = await fragmentsRepo.getById('frag_001');
    expect(first).toBeNull(); // Old one should be gone
  });
});

// ============================================================
// Reveal tests
// ============================================================

describe('fragmentsRepo - reveals', () => {
  beforeEach(async () => {
    // Seed some fragments for reveal tests
    await fragmentsRepo.replaceCatalogue([
      makeFragment('frag_001', 'observer'),
      makeFragment('frag_002', 'observer'),
      makeFragment('frag_003', 'pattern_keeper'),
      makeFragment('frag_004', 'naturalist'),
      makeFragment('frag_005', 'witness'),
    ]);
  });

  it('should start with no reveals', async () => {
    const reveals = await fragmentsRepo.getAllReveals();
    expect(reveals).toHaveLength(0);

    const last = await fragmentsRepo.getLastReveal();
    expect(last).toBeNull();
  });

  it('should mark fragment as revealed', async () => {
    const reveal = await fragmentsRepo.markRevealed('frag_001');

    expect(reveal.fragment_id).toBe('frag_001');
    expect(reveal.id).toBeDefined();

    const isRevealed = await fragmentsRepo.isRevealed('frag_001');
    expect(isRevealed).toBe(true);

    const isNotRevealed = await fragmentsRepo.isRevealed('frag_002');
    expect(isNotRevealed).toBe(false);
  });

  it('should track revealed fragment IDs', async () => {
    await fragmentsRepo.markRevealed('frag_001');
    await fragmentsRepo.markRevealed('frag_003');

    const revealedIds = await fragmentsRepo.getRevealedFragmentIds();
    expect(revealedIds.has('frag_001')).toBe(true);
    expect(revealedIds.has('frag_003')).toBe(true);
    expect(revealedIds.has('frag_002')).toBe(false);
  });

  it('should get last reveal', async () => {
    await fragmentsRepo.markRevealed('frag_001', '2025-01-01T10:00:00Z');
    await fragmentsRepo.markRevealed('frag_002', '2025-01-02T10:00:00Z');

    const last = await fragmentsRepo.getLastReveal();
    expect(last?.fragment_id).toBe('frag_002');
  });

  it('should count reveals in last N days', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    await fragmentsRepo.markRevealed('frag_001', twoDaysAgo.toISOString());
    await fragmentsRepo.markRevealed('frag_002', tenDaysAgo.toISOString());

    const last7Days = await fragmentsRepo.countRevealsInLastDays(7);
    expect(last7Days).toBe(1); // Only the 2-day-old one

    const last14Days = await fragmentsRepo.countRevealsInLastDays(14);
    expect(last14Days).toBe(2); // Both
  });

  it('should get unrevealed counts by voice', async () => {
    // Initially all unrevealed
    const counts1 = await fragmentsRepo.getUnrevealedCountsByVoice();
    expect(counts1.observer).toBe(2);
    expect(counts1.pattern_keeper).toBe(1);
    expect(counts1.naturalist).toBe(1);
    expect(counts1.witness).toBe(1);

    // Reveal one observer
    await fragmentsRepo.markRevealed('frag_001');

    const counts2 = await fragmentsRepo.getUnrevealedCountsByVoice();
    expect(counts2.observer).toBe(1);
    expect(counts2.pattern_keeper).toBe(1);
  });

  it('should get random unrevealed fragment by voice', async () => {
    const fragment = await fragmentsRepo.getRandomUnrevealedByVoice('observer');
    expect(fragment).not.toBeNull();
    expect(['frag_001', 'frag_002']).toContain(fragment?.id);

    // Reveal all observers
    await fragmentsRepo.markRevealed('frag_001');
    await fragmentsRepo.markRevealed('frag_002');

    const noMore = await fragmentsRepo.getRandomUnrevealedByVoice('observer');
    expect(noMore).toBeNull();
  });

  it('should never return same fragment twice', async () => {
    // This is the critical invariant - no repeats
    const revealed = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const fragment = await fragmentsRepo.getRandomUnrevealedByVoice('observer');
      if (!fragment) break;

      expect(revealed.has(fragment.id)).toBe(false);
      revealed.add(fragment.id);
      await fragmentsRepo.markRevealed(fragment.id);
    }

    // All observers should be revealed now
    const remaining = await fragmentsRepo.getRandomUnrevealedByVoice('observer');
    expect(remaining).toBeNull();
  });
});

// ============================================================
// Sync-related tests
// ============================================================

describe('fragmentsRepo - sync', () => {
  beforeEach(async () => {
    await fragmentsRepo.replaceCatalogue([
      makeFragment('frag_001'),
      makeFragment('frag_002'),
    ]);
  });

  it('should track unsynced reveals', async () => {
    await fragmentsRepo.markRevealed('frag_001');

    const unsynced = await fragmentsRepo.getUnsyncedReveals();
    expect(unsynced).toHaveLength(1);
    expect(unsynced[0].fragment_id).toBe('frag_001');
  });

  it('should mark reveals as synced', async () => {
    const reveal = await fragmentsRepo.markRevealed('frag_001');

    await fragmentsRepo.markRevealsSynced([reveal.id]);

    const unsynced = await fragmentsRepo.getUnsyncedReveals();
    expect(unsynced).toHaveLength(0);
  });

  it('should merge remote reveals without duplicates', async () => {
    // Local reveal
    await fragmentsRepo.markRevealed('frag_001');

    // Merge remote (includes one we already have)
    const merged = await fragmentsRepo.mergeRemoteReveals([
      { fragment_id: 'frag_001', revealed_at: '2025-01-01T10:00:00Z' },
      { fragment_id: 'frag_002', revealed_at: '2025-01-02T10:00:00Z' },
    ]);

    // Only frag_002 should be merged (frag_001 already exists)
    expect(merged).toBe(1);

    // Both should now be revealed
    expect(await fragmentsRepo.isRevealed('frag_001')).toBe(true);
    expect(await fragmentsRepo.isRevealed('frag_002')).toBe(true);
  });

  it('should clear reveals for testing', async () => {
    await fragmentsRepo.markRevealed('frag_001');
    await fragmentsRepo.markRevealed('frag_002');

    expect(await fragmentsRepo.getAllReveals()).toHaveLength(2);

    await fragmentsRepo.clearReveals();

    expect(await fragmentsRepo.getAllReveals()).toHaveLength(0);
  });
});

// ============================================================
// Invariant tests
// ============================================================

describe('fragmentsRepo - invariants', () => {
  it('should enforce unique fragment_id in reveals', async () => {
    await fragmentsRepo.replaceCatalogue([makeFragment('frag_001')]);

    // First reveal should work
    await fragmentsRepo.markRevealed('frag_001');

    // Second reveal of same fragment should fail (UNIQUE constraint)
    await expect(fragmentsRepo.markRevealed('frag_001')).rejects.toThrow();
  });
});
