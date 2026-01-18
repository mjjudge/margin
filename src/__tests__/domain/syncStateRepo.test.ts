// src/__tests__/domain/syncStateRepo.test.ts
// Tests for sync state repository

import { getSyncState, setSyncState, clearSyncState, clearAllSyncState } from '../../domain/sync/syncStateRepo';

// Mock expo-sqlite
const mockDb = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

jest.mock('../../data/db', () => ({
  getDb: jest.fn(() => Promise.resolve(mockDb)),
}));

describe('syncStateRepo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSyncState', () => {
    it('returns empty state when no sync has occurred', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const state = await getSyncState('meaning_entries');

      expect(state).toEqual({
        table: 'meaning_entries',
        lastSyncAt: undefined,
      });
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT value FROM sync_state WHERE key = ?',
        ['last_sync_at:meaning_entries']
      );
    });

    it('returns stored lastSyncAt when present', async () => {
      const timestamp = '2026-01-18T12:00:00.000Z';
      mockDb.getFirstAsync.mockResolvedValue({ value: timestamp });

      const state = await getSyncState('practice_sessions');

      expect(state).toEqual({
        table: 'practice_sessions',
        lastSyncAt: timestamp,
      });
    });
  });

  describe('setSyncState', () => {
    it('upserts sync state with correct key', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);
      const timestamp = '2026-01-18T12:00:00.000Z';

      await setSyncState('meaning_entries', timestamp);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sync_state'),
        ['last_sync_at:meaning_entries', timestamp]
      );
    });
  });

  describe('clearSyncState', () => {
    it('deletes sync state for specific table', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await clearSyncState('meaning_entries');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM sync_state WHERE key = ?',
        ['last_sync_at:meaning_entries']
      );
    });
  });

  describe('clearAllSyncState', () => {
    it('deletes all sync state keys', async () => {
      mockDb.runAsync.mockResolvedValue(undefined);

      await clearAllSyncState();

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM sync_state WHERE key LIKE ?',
        ['last_sync_at:%']
      );
    });
  });
});
