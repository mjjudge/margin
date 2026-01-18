// src/__tests__/repos/meaningRepo.test.ts
import { meaningRepo } from '../../data/repos/meaningRepo';

// Access mock helpers
const expoSqlite = jest.requireMock('expo-sqlite') as {
  __resetMock: () => void;
};

describe('meaningRepo', () => {
  beforeEach(() => {
    expoSqlite.__resetMock();
  });

  describe('create', () => {
    it('should create an entry with required fields', async () => {
      const entry = await meaningRepo.create({
        category: 'meaningful',
      });

      expect(entry.id).toBeDefined();
      expect(entry.category).toBe('meaningful');
      expect(entry.tags).toEqual([]);
      expect(entry.created_at).toBeDefined();
      expect(entry.updated_at).toBeDefined();
      expect(entry.time_of_day).toBeDefined();
    });

    it('should create an entry with all fields', async () => {
      const entry = await meaningRepo.create({
        category: 'joyful',
        text: 'A nice moment',
        tags: ['morning', 'coffee'],
        time_of_day: 'morning',
      });

      expect(entry.category).toBe('joyful');
      expect(entry.text).toBe('A nice moment');
      expect(entry.tags).toEqual(['morning', 'coffee']);
      expect(entry.time_of_day).toBe('morning');
    });
  });

  describe('getById', () => {
    it('should return null for non-existent entry', async () => {
      const entry = await meaningRepo.getById('non-existent-id');
      expect(entry).toBeNull();
    });
  });

  describe('count', () => {
    it('should return 0 for empty table', async () => {
      const count = await meaningRepo.count();
      expect(count).toBe(0);
    });
  });

  describe('countByCategory', () => {
    it('should return zeros for all categories when empty', async () => {
      const counts = await meaningRepo.countByCategory();
      expect(counts).toEqual({
        meaningful: 0,
        joyful: 0,
        painful_significant: 0,
        empty_numb: 0,
      });
    });
  });
});
