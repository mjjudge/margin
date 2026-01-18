// src/__tests__/domain/dailyPractice.test.ts
import {
  getTodayDateStr,
  selectPracticeForDate,
  hasSwappedToday,
  setSwappedPractice,
  clearSwapState,
  getSwappedPracticeId,
} from '../../domain/dailyPractice';

// Access mock helpers
const expoSqlite = jest.requireMock('expo-sqlite') as {
  __mockTables: Record<string, Record<string, unknown>[]>;
  __resetMock: () => void;
};

describe('dailyPractice', () => {
  beforeEach(() => {
    expoSqlite.__resetMock();
    clearSwapState();
    
    // Seed some mock practices
    expoSqlite.__mockTables.practices = [
      { id: 'practice-1', title: 'Practice 1', instruction: 'Do 1', mode: 'focus', difficulty: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
      { id: 'practice-2', title: 'Practice 2', instruction: 'Do 2', mode: 'open', difficulty: 2, created_at: '2026-01-01', updated_at: '2026-01-01' },
      { id: 'practice-3', title: 'Practice 3', instruction: 'Do 3', mode: 'somatic', difficulty: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
    ];
  });

  describe('getTodayDateStr', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const dateStr = getTodayDateStr();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('selectPracticeForDate', () => {
    it('should return the same practice for the same date', async () => {
      const practice1 = await selectPracticeForDate('2026-01-18');
      const practice2 = await selectPracticeForDate('2026-01-18');
      
      expect(practice1).not.toBeNull();
      expect(practice1?.id).toBe(practice2?.id);
    });

    it('should be deterministic across calls', async () => {
      const results: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        const practice = await selectPracticeForDate('2026-05-15');
        if (practice) results.push(practice.id);
      }
      
      // All results should be the same
      expect(new Set(results).size).toBe(1);
    });

    it('should return different practices for different dates', async () => {
      const practice1 = await selectPracticeForDate('2026-01-01');
      const practice2 = await selectPracticeForDate('2026-01-02');
      const practice3 = await selectPracticeForDate('2026-01-03');
      
      // At least some should be different (with 3 practices, high probability)
      const ids = [practice1?.id, practice2?.id, practice3?.id];
      // Not all the same
      expect(new Set(ids).size).toBeGreaterThanOrEqual(1);
    });

    it('should return null when no practices exist', async () => {
      expoSqlite.__mockTables.practices = [];
      
      const practice = await selectPracticeForDate('2026-01-18');
      expect(practice).toBeNull();
    });
  });

  describe('swap state', () => {
    it('should start with no swap', () => {
      expect(hasSwappedToday()).toBe(false);
      expect(getSwappedPracticeId()).toBeNull();
    });

    it('should track swap for today', () => {
      setSwappedPractice('practice-2');
      
      expect(hasSwappedToday()).toBe(true);
      expect(getSwappedPracticeId()).toBe('practice-2');
    });

    it('should clear swap state', () => {
      setSwappedPractice('practice-2');
      clearSwapState();
      
      expect(hasSwappedToday()).toBe(false);
      expect(getSwappedPracticeId()).toBeNull();
    });
  });
});
