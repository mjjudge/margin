// src/__tests__/domain/clustering.test.ts
// Deterministic tests for tag clustering

import { computeClusters, getEntriesForCluster } from '../../domain/map/clustering';
import type { MeaningEntry } from '../../domain/models';

// Test fixture: entries with known tag co-occurrences
const testEntries: MeaningEntry[] = [
  // Cluster 1: work + morning (appear together in 3 entries)
  {
    id: '1',
    category: 'meaningful',
    tags: ['work', 'morning'],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: '2',
    category: 'meaningful',
    tags: ['work', 'morning', 'quiet'],
    created_at: '2026-01-11T08:00:00Z',
    updated_at: '2026-01-11T08:00:00Z',
  },
  {
    id: '3',
    category: 'joyful',
    tags: ['work', 'morning'],
    created_at: '2026-01-12T09:00:00Z',
    updated_at: '2026-01-12T09:00:00Z',
  },
  // Cluster 2: evening + alone (appear together in 2 entries)
  {
    id: '4',
    category: 'empty_numb',
    tags: ['evening', 'alone'],
    created_at: '2026-01-13T20:00:00Z',
    updated_at: '2026-01-13T20:00:00Z',
  },
  {
    id: '5',
    category: 'empty_numb',
    tags: ['evening', 'alone', 'tired'],
    created_at: '2026-01-14T21:00:00Z',
    updated_at: '2026-01-14T21:00:00Z',
  },
  // Standalone entries (shouldn't form clusters)
  {
    id: '6',
    category: 'joyful',
    tags: ['social'],
    created_at: '2026-01-15T12:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
  },
];

describe('computeClusters', () => {
  it('finds clusters of co-occurring tags', () => {
    const clusters = computeClusters(testEntries);
    
    expect(clusters.length).toBeGreaterThan(0);
    
    // Should find work+morning cluster
    const workMorningCluster = clusters.find(
      c => c.tags.includes('work') && c.tags.includes('morning')
    );
    expect(workMorningCluster).toBeDefined();
    expect(workMorningCluster!.entryCount).toBe(3);
  });

  it('respects Jaccard threshold', () => {
    // With very high threshold, should find fewer clusters
    const strictClusters = computeClusters(testEntries, 0.9);
    const looseClusters = computeClusters(testEntries, 0.1);
    
    // Loose threshold should find at least as many clusters
    expect(looseClusters.length).toBeGreaterThanOrEqual(strictClusters.length);
  });

  it('respects maxClusters parameter', () => {
    const clusters = computeClusters(testEntries, 0.3, 1);
    
    expect(clusters.length).toBeLessThanOrEqual(1);
  });

  it('returns empty array for empty entries', () => {
    const clusters = computeClusters([]);
    
    expect(clusters).toEqual([]);
  });

  it('filters out single-tag clusters', () => {
    const clusters = computeClusters(testEntries);
    
    // All clusters should have at least 2 tags
    for (const cluster of clusters) {
      expect(cluster.tags.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('is deterministic - same input produces same output', () => {
    const result1 = computeClusters(testEntries);
    const result2 = computeClusters(testEntries);
    
    expect(result1).toEqual(result2);
  });

  it('assigns sequential IDs starting from 0', () => {
    const clusters = computeClusters(testEntries);
    
    for (let i = 0; i < clusters.length; i++) {
      expect(clusters[i].id).toBe(i);
    }
  });
});

describe('getEntriesForCluster', () => {
  it('returns entries containing all cluster tags', () => {
    const clusters = computeClusters(testEntries);
    const workMorningCluster = clusters.find(
      c => c.tags.includes('work') && c.tags.includes('morning')
    );
    
    if (workMorningCluster) {
      const matchingEntries = getEntriesForCluster(testEntries, workMorningCluster);
      
      expect(matchingEntries.length).toBe(workMorningCluster.entryCount);
      
      // All matching entries should have both tags
      for (const entry of matchingEntries) {
        const tagsLower = entry.tags.map(t => t.toLowerCase());
        expect(tagsLower).toContain('work');
        expect(tagsLower).toContain('morning');
      }
    }
  });

  it('returns empty array when no entries match', () => {
    const fakeCluster = { id: 99, tags: ['nonexistent', 'tags'], entryCount: 0 };
    const result = getEntriesForCluster(testEntries, fakeCluster);
    
    expect(result).toEqual([]);
  });
});

describe('clustering edge cases', () => {
  it('handles entries with no tags', () => {
    const entriesWithNoTags: MeaningEntry[] = [
      {
        id: '1',
        category: 'meaningful',
        tags: [],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const clusters = computeClusters(entriesWithNoTags);
    expect(clusters).toEqual([]);
  });

  it('handles entries with single tags only', () => {
    const singleTagEntries: MeaningEntry[] = [
      {
        id: '1',
        category: 'meaningful',
        tags: ['work'],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        category: 'joyful',
        tags: ['play'],
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ];

    const clusters = computeClusters(singleTagEntries);
    // No co-occurrence possible with single tags
    expect(clusters).toEqual([]);
  });
});
