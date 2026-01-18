import { SyncResult } from './syncTypes';

export async function syncPracticeSessions(): Promise<SyncResult> {
  return {
    table: 'practice_sessions',
    pulled: 0,
    pushed: 0,
    conflictsResolved: 0,
    errors: ['not implemented'],
  };
}
