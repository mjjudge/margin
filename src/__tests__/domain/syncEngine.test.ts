// src/__tests__/domain/syncEngine.test.ts
// Tests for sync engine

// Mock supabase first
const mockGetUser = jest.fn();

jest.mock('../../data/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Mock individual sync functions
jest.mock('../../domain/sync/syncMeaningEntries', () => ({
  syncMeaningEntries: jest.fn(),
}));

jest.mock('../../domain/sync/syncPracticeSessions', () => ({
  syncPracticeSessions: jest.fn(),
}));

import { runFullSync } from '../../domain/sync/syncEngine';
import { syncMeaningEntries } from '../../domain/sync/syncMeaningEntries';
import { syncPracticeSessions } from '../../domain/sync/syncPracticeSessions';

describe('syncEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runFullSync', () => {
    it('returns error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Not authenticated');
      expect(syncMeaningEntries).not.toHaveBeenCalled();
      expect(syncPracticeSessions).not.toHaveBeenCalled();
    });

    it('runs both sync functions when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      (syncMeaningEntries as jest.Mock).mockResolvedValue({
        table: 'meaning_entries',
        pulled: 5,
        pushed: 2,
        conflictsResolved: 1,
        errors: [],
      });

      (syncPracticeSessions as jest.Mock).mockResolvedValue({
        table: 'practice_sessions',
        pulled: 3,
        pushed: 1,
        conflictsResolved: 0,
        errors: [],
      });

      const result = await runFullSync();

      expect(result.success).toBe(true);
      expect(result.totalPulled).toBe(8);
      expect(result.totalPushed).toBe(3);
      expect(result.totalConflicts).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(2);
    });

    it('aggregates errors from sync functions', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      (syncMeaningEntries as jest.Mock).mockResolvedValue({
        table: 'meaning_entries',
        pulled: 0,
        pushed: 0,
        conflictsResolved: 0,
        errors: ['Network error'],
      });

      (syncPracticeSessions as jest.Mock).mockResolvedValue({
        table: 'practice_sessions',
        pulled: 0,
        pushed: 0,
        conflictsResolved: 0,
        errors: ['Timeout'],
      });

      const result = await runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Network error');
      expect(result.errors).toContain('Timeout');
    });

    it('handles auth check failure gracefully', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth service unavailable'));

      const result = await runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Auth check failed');
    });
  });
});
