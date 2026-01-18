// src/__tests__/domain/mapStats.test.ts
// Deterministic tests for map stats computation

import { 
  countByCategory, 
  countTags, 
  computeNetMeaning, 
  computeMapStats 
} from '../../domain/map/mapStats';
import type { MeaningEntry } from '../../domain/models';

// Test fixture: known entries for deterministic testing
const testEntries: MeaningEntry[] = [
  {
    id: '1',
    category: 'meaningful',
    text: 'Morning meditation',
    tags: ['morning', 'quiet', 'work'],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: '2',
    category: 'joyful',
    text: 'Coffee with friend',
    tags: ['social', 'morning'],
    created_at: '2026-01-11T10:00:00Z',
    updated_at: '2026-01-11T10:00:00Z',
  },
  {
    id: '3',
    category: 'painful_significant',
    text: 'Difficult conversation',
    tags: ['work', 'social'],
    created_at: '2026-01-12T14:00:00Z',
    updated_at: '2026-01-12T14:00:00Z',
  },
  {
    id: '4',
    category: 'empty_numb',
    text: 'Scrolling for hours',
    tags: ['evening', 'alone'],
    created_at: '2026-01-13T20:00:00Z',
    updated_at: '2026-01-13T20:00:00Z',
  },
  {
    id: '5',
    category: 'meaningful',
    text: 'Deep work session',
    tags: ['work', 'morning', 'quiet'],
    created_at: '2026-01-14T09:00:00Z',
    updated_at: '2026-01-14T09:00:00Z',
  },
];

describe('countByCategory', () => {
  it('counts entries by category correctly', () => {
    const result = countByCategory(testEntries);
    
    expect(result.meaningful).toBe(2);
    expect(result.joyful).toBe(1);
    expect(result.painful_significant).toBe(1);
    expect(result.empty_numb).toBe(1);
  });

  it('returns zeros for empty array', () => {
    const result = countByCategory([]);
    
    expect(result.meaningful).toBe(0);
    expect(result.joyful).toBe(0);
    expect(result.painful_significant).toBe(0);
    expect(result.empty_numb).toBe(0);
  });
});

describe('countTags', () => {
  it('counts tags correctly and sorts by count desc', () => {
    const result = countTags(testEntries);
    
    // work appears 3 times, morning appears 3 times
    // They should be sorted alphabetically since counts are equal
    expect(result[0]).toEqual({ tag: 'morning', count: 3 });
    expect(result[1]).toEqual({ tag: 'work', count: 3 });
    
    // quiet and social appear 2 times each
    expect(result[2]).toEqual({ tag: 'quiet', count: 2 });
    expect(result[3]).toEqual({ tag: 'social', count: 2 });
  });

  it('normalizes tags to lowercase', () => {
    const entries: MeaningEntry[] = [{
      id: '1',
      category: 'meaningful',
      tags: ['Work', 'MORNING', 'Quiet'],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }];

    const result = countTags(entries);
    
    expect(result.map(t => t.tag)).toEqual(['morning', 'quiet', 'work']);
  });

  it('is deterministic - same input always produces same output', () => {
    const result1 = countTags(testEntries);
    const result2 = countTags(testEntries);
    
    expect(result1).toEqual(result2);
  });
});

describe('computeNetMeaning', () => {
  it('computes net meaning correctly', () => {
    const result = computeNetMeaning(testEntries);
    
    // Find specific tags
    const morning = result.find(t => t.tag === 'morning');
    const work = result.find(t => t.tag === 'work');
    const evening = result.find(t => t.tag === 'evening');

    // morning: 2 meaningful + 1 joyful - 0 painful - 0 empty = +3
    expect(morning?.netMeaning).toBe(3);

    // work: 2 meaningful + 0 joyful - 1 painful - 0 empty = +1
    expect(work?.netMeaning).toBe(1);

    // evening: 0 meaningful + 0 joyful - 0 painful - 1 empty = -1
    expect(evening?.netMeaning).toBe(-1);
  });

  it('sorts by absolute netMeaning descending', () => {
    const result = computeNetMeaning(testEntries);
    
    // First few should have highest absolute values
    for (let i = 1; i < result.length; i++) {
      const prevAbs = Math.abs(result[i - 1].netMeaning);
      const currAbs = Math.abs(result[i].netMeaning);
      // Should be >= (descending)
      expect(prevAbs).toBeGreaterThanOrEqual(currAbs);
    }
  });

  it('is deterministic', () => {
    const result1 = computeNetMeaning(testEntries);
    const result2 = computeNetMeaning(testEntries);
    
    expect(result1).toEqual(result2);
  });
});

describe('computeMapStats', () => {
  it('computes full stats correctly', () => {
    const stats = computeMapStats(testEntries);
    
    expect(stats.totalEntries).toBe(5);
    expect(stats.byCategory.meaningful).toBe(2);
    expect(stats.topTags.length).toBeGreaterThan(0);
    expect(stats.tagNetMeaning.length).toBeGreaterThan(0);
  });

  it('respects topN parameter for tags', () => {
    const stats = computeMapStats(testEntries, 2);
    
    expect(stats.topTags.length).toBe(2);
  });

  it('handles empty entries', () => {
    const stats = computeMapStats([]);
    
    expect(stats.totalEntries).toBe(0);
    expect(stats.topTags).toEqual([]);
    expect(stats.tagNetMeaning).toEqual([]);
  });
});
