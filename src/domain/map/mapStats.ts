// src/domain/map/mapStats.ts
// Deterministic map statistics computation (SPEC section 7)

import type { MeaningEntry, MeaningCategory } from '../models';

export interface TagCount {
  tag: string;
  count: number;
}

export interface TagCategoryCount {
  tag: string;
  meaningful: number;
  joyful: number;
  painful_significant: number;
  empty_numb: number;
}

export interface TagNetMeaning {
  tag: string;
  netMeaning: number; // positive = meaningful+joyful, negative = painful+empty
  total: number;
}

export interface MapStats {
  totalEntries: number;
  byCategory: Record<MeaningCategory, number>;
  topTags: TagCount[];
  tagNetMeaning: TagNetMeaning[];
}

/**
 * Count entries by category
 */
export function countByCategory(entries: MeaningEntry[]): Record<MeaningCategory, number> {
  const counts: Record<MeaningCategory, number> = {
    meaningful: 0,
    joyful: 0,
    painful_significant: 0,
    empty_numb: 0,
  };

  for (const entry of entries) {
    counts[entry.category]++;
  }

  return counts;
}

/**
 * Count tag occurrences across all entries
 * Returns tags sorted by count (desc), then alphabetically for determinism
 */
export function countTags(entries: MeaningEntry[]): TagCount[] {
  const tagMap = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      const normalized = tag.toLowerCase().trim();
      if (normalized) {
        tagMap.set(normalized, (tagMap.get(normalized) ?? 0) + 1);
      }
    }
  }

  const tagCounts: TagCount[] = [];
  for (const [tag, count] of tagMap) {
    tagCounts.push({ tag, count });
  }

  // Sort by count desc, then alphabetically for determinism
  tagCounts.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.tag.localeCompare(b.tag);
  });

  return tagCounts;
}

/**
 * Count tags per category (for net_meaning calculation)
 */
export function countTagsByCategory(entries: MeaningEntry[]): TagCategoryCount[] {
  const tagMap = new Map<string, TagCategoryCount>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      const normalized = tag.toLowerCase().trim();
      if (!normalized) continue;

      let record = tagMap.get(normalized);
      if (!record) {
        record = {
          tag: normalized,
          meaningful: 0,
          joyful: 0,
          painful_significant: 0,
          empty_numb: 0,
        };
        tagMap.set(normalized, record);
      }

      record[entry.category]++;
    }
  }

  const result: TagCategoryCount[] = Array.from(tagMap.values());
  // Sort alphabetically for determinism
  result.sort((a, b) => a.tag.localeCompare(b.tag));

  return result;
}

/**
 * Compute net_meaning for each tag
 * net_meaning(tag) = count(tag, meaningful + joyful) - count(tag, painful_significant + empty_numb)
 * 
 * Positive = tag appears more in meaningful/joyful entries
 * Negative = tag appears more in painful/empty entries
 */
export function computeNetMeaning(entries: MeaningEntry[]): TagNetMeaning[] {
  const tagCategoryCounts = countTagsByCategory(entries);

  const result: TagNetMeaning[] = tagCategoryCounts.map(tc => {
    const positive = tc.meaningful + tc.joyful;
    const negative = tc.painful_significant + tc.empty_numb;
    return {
      tag: tc.tag,
      netMeaning: positive - negative,
      total: positive + negative,
    };
  });

  // Sort by absolute netMeaning (desc), then total (desc), then alphabetically
  result.sort((a, b) => {
    const absA = Math.abs(a.netMeaning);
    const absB = Math.abs(b.netMeaning);
    if (absB !== absA) return absB - absA;
    if (b.total !== a.total) return b.total - a.total;
    return a.tag.localeCompare(b.tag);
  });

  return result;
}

/**
 * Compute full map stats from entries
 */
export function computeMapStats(entries: MeaningEntry[], topN = 10): MapStats {
  return {
    totalEntries: entries.length,
    byCategory: countByCategory(entries),
    topTags: countTags(entries).slice(0, topN),
    tagNetMeaning: computeNetMeaning(entries),
  };
}
