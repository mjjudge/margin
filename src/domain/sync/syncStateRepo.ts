import { SyncState, SyncTable } from './syncTypes';

export interface SyncStateRepo {
  get(table: SyncTable): Promise<SyncState>;
  set(table: SyncTable, lastSyncAt: string): Promise<void>;
}
