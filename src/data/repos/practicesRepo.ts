// src/data/repos/practicesRepo.ts
// Read-only repo for practices (seeded, not user-editable)

import { getDb } from '../db';
import type { Practice, PracticeMode } from '../../domain/models';

export interface PracticeRow {
  id: string;
  title: string;
  instruction: string;
  mode: string;
  difficulty: number;
  duration_seconds: number | null;
  contra_notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPractice(row: PracticeRow): Practice {
  return {
    id: row.id,
    title: row.title,
    instruction: row.instruction,
    mode: row.mode as PracticeMode,
    difficulty: row.difficulty,
    duration_seconds: row.duration_seconds ?? undefined,
    contra_notes: row.contra_notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const practicesRepo = {
  /**
   * Get all practices
   */
  async getAll(): Promise<Practice[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<PracticeRow>(
      'SELECT * FROM practices ORDER BY difficulty ASC, title ASC'
    );
    return rows.map(rowToPractice);
  },

  /**
   * Get a practice by ID
   */
  async getById(id: string): Promise<Practice | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<PracticeRow>(
      'SELECT * FROM practices WHERE id = ?',
      [id]
    );
    return row ? rowToPractice(row) : null;
  },

  /**
   * Get practices by mode
   */
  async getByMode(mode: PracticeMode): Promise<Practice[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<PracticeRow>(
      'SELECT * FROM practices WHERE mode = ? ORDER BY difficulty ASC',
      [mode]
    );
    return rows.map(rowToPractice);
  },

  /**
   * Get practice count
   */
  async count(): Promise<number> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM practices'
    );
    return result?.count ?? 0;
  },

  /**
   * Upsert a practice (used for seeding)
   */
  async upsert(practice: Practice): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO practices (id, title, instruction, mode, difficulty, duration_seconds, contra_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         instruction = excluded.instruction,
         mode = excluded.mode,
         difficulty = excluded.difficulty,
         duration_seconds = excluded.duration_seconds,
         contra_notes = excluded.contra_notes,
         updated_at = excluded.updated_at`,
      [
        practice.id,
        practice.title,
        practice.instruction,
        practice.mode,
        practice.difficulty,
        practice.duration_seconds ?? null,
        practice.contra_notes ?? null,
        practice.created_at,
        practice.updated_at,
      ]
    );
  },
};
