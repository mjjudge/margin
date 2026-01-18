import { SyncResult } from './syncTypes';
import { syncMeaningEntries } from './syncMeaningEntries';
import { syncPracticeSessions } from './syncPracticeSessions';

export async function runFullSync(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  results.push(await syncMeaningEntries());
  results.push(await syncPracticeSessions());
  return results;
}
