// src/data/repos/sessionsRepo.ts
// CRUD for practice sessions

import { getDb } from '../db';
import type { PracticeSession } from '../../domain/models';

export interface SessionRow {
  id: string;
  practice_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  user_rating: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToSession(row: SessionRow): PracticeSession {
  return {
    id: row.id,
    practice_id: row.practice_id,
    started_at: row.started_at,
    completed_at: row.completed_at ?? undefined,
    status: row.status as PracticeSession['status'],
    user_rating: row.user_rating as PracticeSession['user_rating'],
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? undefined,
  };
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

export const sessionsRepo = {
  /**
   * Create a new session (on practice start)
   */
  async create(practiceId: string): Promise<PracticeSession> {
    const db = await getDb();
    const now = nowISO();
    const session: PracticeSession = {
      id: generateId(),
      practice_id: practiceId,
      started_at: now,
      status: 'started',
      created_at: now,
      updated_at: now,
    };

    await db.runAsync(
      `INSERT INTO practice_sessions (id, practice_id, started_at, completed_at, status, user_rating, notes, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.practice_id,
        session.started_at,
        null,
        session.status,
        null,
        null,
        session.created_at,
        session.updated_at,
        null,
      ]
    );

    return session;
  },

  /**
   * Complete a session
   */
  async complete(
    id: string,
    options?: { user_rating?: PracticeSession['user_rating']; notes?: string }
  ): Promise<void> {
    const db = await getDb();
    const now = nowISO();
    await db.runAsync(
      `UPDATE practice_sessions 
       SET status = 'completed', completed_at = ?, user_rating = ?, notes = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [now, options?.user_rating ?? null, options?.notes ?? null, now, id]
    );
  },

  /**
   * Abandon a session
   */
  async abandon(id: string): Promise<void> {
    const db = await getDb();
    const now = nowISO();
    await db.runAsync(
      `UPDATE practice_sessions SET status = 'abandoned', updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
      [now, id]
    );
  },

  /**
   * Get a session by ID
   */
  async getById(id: string): Promise<PracticeSession | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<SessionRow>(
      'SELECT * FROM practice_sessions WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return row ? rowToSession(row) : null;
  },

  /**
   * Get all sessions (excluding soft-deleted)
   */
  async getAll(): Promise<PracticeSession[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<SessionRow>(
      'SELECT * FROM practice_sessions WHERE deleted_at IS NULL ORDER BY started_at DESC'
    );
    return rows.map(rowToSession);
  },

  /**
   * Get sessions for a specific practice
   */
  async getByPracticeId(practiceId: string): Promise<PracticeSession[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<SessionRow>(
      'SELECT * FROM practice_sessions WHERE practice_id = ? AND deleted_at IS NULL ORDER BY started_at DESC',
      [practiceId]
    );
    return rows.map(rowToSession);
  },

  /**
   * Get completed sessions for today
   */
  async getCompletedToday(): Promise<PracticeSession[]> {
    const db = await getDb();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const rows = await db.getAllAsync<SessionRow>(
      `SELECT * FROM practice_sessions 
       WHERE status = 'completed' AND deleted_at IS NULL AND started_at >= ?
       ORDER BY started_at DESC`,
      [todayStart.toISOString()]
    );
    return rows.map(rowToSession);
  },

  /**
   * Soft delete a session
   */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    const now = nowISO();
    await db.runAsync(
      'UPDATE practice_sessions SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [now, now, id]
    );
  },

  /**
   * Count completed sessions
   */
  async countCompleted(): Promise<number> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM practice_sessions WHERE status = 'completed' AND deleted_at IS NULL`
    );
    return result?.count ?? 0;
  },
};
