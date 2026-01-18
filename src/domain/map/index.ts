// src/domain/map/index.ts
// Re-export map functions

export { 
  computeMapStats, 
  countByCategory, 
  countTags, 
  computeNetMeaning,
  type MapStats,
  type TagCount,
  type TagNetMeaning,
} from './mapStats';

export { 
  computeClusters, 
  getEntriesForCluster,
  type Cluster,
} from './clustering';
