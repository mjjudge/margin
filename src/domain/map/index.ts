// src/domain/map/index.ts
// Re-export map functions

export { 
  computeMapStats, 
  countByCategory, 
  countTags, 
  computeNetMeaning,
  filterEntriesByTimeWindow,
  type MapStats,
  type TagCount,
  type TagNetMeaning,
  type TimeWindow,
} from './mapStats';

export { 
  computeClusters, 
  getEntriesForCluster,
  type Cluster,
} from './clustering';
