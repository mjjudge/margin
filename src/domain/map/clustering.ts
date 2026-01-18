// src/domain/map/clustering.ts
// Deterministic tag clustering using Jaccard similarity (SPEC section 7.3)

import type { MeaningEntry } from '../models';

export interface Cluster {
  id: number;
  tags: string[];
  entryCount: number; // how many entries contain ALL tags in cluster
}

/**
 * Build a map of tag -> set of entry IDs that contain this tag
 */
function buildTagToEntriesMap(entries: MeaningEntry[]): Map<string, Set<string>> {
  const tagToEntries = new Map<string, Set<string>>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      const normalized = tag.toLowerCase().trim();
      if (!normalized) continue;

      let entrySet = tagToEntries.get(normalized);
      if (!entrySet) {
        entrySet = new Set();
        tagToEntries.set(normalized, entrySet);
      }
      entrySet.add(entry.id);
    }
  }

  return tagToEntries;
}

/**
 * Compute Jaccard similarity between two sets
 * J(A,B) = |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Build adjacency list of tags with Jaccard >= threshold
 */
function buildSimilarityGraph(
  tagToEntries: Map<string, Set<string>>,
  threshold: number
): Map<string, Set<string>> {
  const tags = Array.from(tagToEntries.keys()).sort(); // sort for determinism
  const graph = new Map<string, Set<string>>();

  for (const tag of tags) {
    graph.set(tag, new Set());
  }

  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const tagA = tags[i];
      const tagB = tags[j];
      const setA = tagToEntries.get(tagA)!;
      const setB = tagToEntries.get(tagB)!;

      const similarity = jaccardSimilarity(setA, setB);
      if (similarity >= threshold) {
        graph.get(tagA)!.add(tagB);
        graph.get(tagB)!.add(tagA);
      }
    }
  }

  return graph;
}

/**
 * Find connected components using BFS (deterministic via sorted iteration)
 */
function findConnectedComponents(graph: Map<string, Set<string>>): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];
  const tags = Array.from(graph.keys()).sort(); // deterministic order

  for (const startTag of tags) {
    if (visited.has(startTag)) continue;

    const component: string[] = [];
    const queue = [startTag];
    visited.add(startTag);

    while (queue.length > 0) {
      const tag = queue.shift()!;
      component.push(tag);

      const neighbors = Array.from(graph.get(tag) ?? []).sort();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    component.sort(); // ensure deterministic ordering within cluster
    components.push(component);
  }

  return components;
}

/**
 * Count entries that contain ALL specified tags
 */
function countEntriesWithAllTags(entries: MeaningEntry[], tags: string[]): number {
  if (tags.length === 0) return 0;

  let count = 0;
  for (const entry of entries) {
    const entryTagsLower = entry.tags.map(t => t.toLowerCase().trim());
    const hasAll = tags.every(tag => entryTagsLower.includes(tag));
    if (hasAll) count++;
  }

  return count;
}

/**
 * Compute tag clusters using Jaccard similarity
 * 
 * @param entries - all meaning entries
 * @param threshold - Jaccard threshold (default 0.3 per SPEC)
 * @param maxClusters - max clusters to return (default 5 per SPEC)
 */
export function computeClusters(
  entries: MeaningEntry[],
  threshold = 0.3,
  maxClusters = 5
): Cluster[] {
  if (entries.length === 0) return [];

  const tagToEntries = buildTagToEntriesMap(entries);
  
  // Filter to tags that appear in at least 2 entries (meaningful for clustering)
  const significantTags = new Map<string, Set<string>>();
  for (const [tag, entrySet] of tagToEntries) {
    if (entrySet.size >= 2) {
      significantTags.set(tag, entrySet);
    }
  }

  if (significantTags.size === 0) return [];

  const graph = buildSimilarityGraph(significantTags, threshold);
  const components = findConnectedComponents(graph);

  // Filter to clusters with 2+ tags (single-tag "clusters" aren't interesting)
  const multiTagClusters = components.filter(c => c.length >= 2);

  // Score clusters by: number of tags * entry count (for ranking)
  const scoredClusters: Cluster[] = multiTagClusters.map((tags, idx) => ({
    id: idx,
    tags,
    entryCount: countEntriesWithAllTags(entries, tags),
  }));

  // Sort by entryCount desc, then by tag count desc, then alphabetically by first tag
  scoredClusters.sort((a, b) => {
    if (b.entryCount !== a.entryCount) return b.entryCount - a.entryCount;
    if (b.tags.length !== a.tags.length) return b.tags.length - a.tags.length;
    return a.tags[0].localeCompare(b.tags[0]);
  });

  // Re-assign IDs after sorting
  return scoredClusters.slice(0, maxClusters).map((c, idx) => ({
    ...c,
    id: idx,
  }));
}

/**
 * Get entries that match a specific cluster (contain ALL cluster tags)
 */
export function getEntriesForCluster(entries: MeaningEntry[], cluster: Cluster): MeaningEntry[] {
  return entries.filter(entry => {
    const entryTagsLower = entry.tags.map(t => t.toLowerCase().trim());
    return cluster.tags.every(tag => entryTagsLower.includes(tag));
  });
}
