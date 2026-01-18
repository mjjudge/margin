// src/__tests__/repos/sessionsRepo.test.ts
import { sessionsRepo } from '../../data/repos/sessionsRepo';

// Access mock helpers
const expoSqlite = jest.requireMock('expo-sqlite') as {
  __resetMock: () => void;
};

describe('sessionsRepo', () => {
  beforeEach(() => {
    expoSqlite.__resetMock();
  });

  describe('create', () => {
    it('should create a session with started status', async () => {
      const session = await sessionsRepo.create('practice-123');

      expect(session.id).toBeDefined();
      expect(session.practice_id).toBe('practice-123');
      expect(session.status).toBe('started');
      expect(session.started_at).toBeDefined();
      expect(session.created_at).toBeDefined();
      expect(session.completed_at).toBeUndefined();
    });
  });

  describe('getById', () => {
    it('should return null for non-existent session', async () => {
      const session = await sessionsRepo.getById('non-existent-id');
      expect(session).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no sessions', async () => {
      const sessions = await sessionsRepo.getAll();
      expect(sessions).toEqual([]);
    });
  });

  describe('countCompleted', () => {
    it('should return 0 when no completed sessions', async () => {
      const count = await sessionsRepo.countCompleted();
      expect(count).toBe(0);
    });
  });
});
