// src/data/repos/meaningRepo.ts
// CRUD for meaning entries

import { getDb } from '../db';
import type { MeaningEntry, MeaningCategory } from '../../domain/models';

export interface MeaningRow {
  id: string;
  category: string;
  text: string | null;
  tags: string; // JSON string
  time_of_day: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToEntry(row: MeaningRow): MeaningEntry {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) {
      tags = parsed.filter((t): t is string => typeof t === 'string');
    }
  } catch {
    // Invalid JSON, default to empty
  }

  return {
    id: row.id,
    category: row.category as MeaningCategory,
    text: row.text ?? undefined,
    tags,
    time_of_day: row.time_of_day as MeaningEntry['time_of_day'],
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

function getTimeOfDay(): MeaningEntry['time_of_day'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export interface CreateEntryInput {
  category: MeaningCategory;
  text?: string;
  tags?: string[];
  time_of_day?: MeaningEntry['time_of_day'];
}

export interface UpdateEntryInput {
  category?: MeaningCategory;
  text?: string;
  tags?: string[];
}

export const meaningRepo = {
  /**
   * Create a new meaning entry
   */
  async create(input: CreateEntryInput): Promise<MeaningEntry> {
    const db = await getDb();
    const now = nowISO();
    const entry: MeaningEntry = {
      id: generateId(),
      category: input.category,
      text: input.text,
      tags: input.tags ?? [],
      time_of_day: input.time_of_day ?? getTimeOfDay(),
      created_at: now,
      updated_at: now,
    };

    await db.runAsync(
      `INSERT INTO meaning_entries (id, category, text, tags, time_of_day, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.category,
        entry.text ?? null,
        JSON.stringify(entry.tags),
        entry.time_of_day ?? null,
        entry.created_at,
        entry.updated_at,
        null,
      ]
    );

    return entry;
  },

  /**
   * Update an existing entry
   */
  async update(id: string, input: UpdateEntryInput): Promise<void> {
    const db = await getDb();
    const now = nowISO();
    
    const updates: string[] = ['updated_at = ?'];
    const params: (string | null)[] = [now];

    if (input.category !== undefined) {
      updates.push('category = ?');
      params.push(input.category);
    }
    if (input.text !== undefined) {
      updates.push('text = ?');
      params.push(input.text || null);
    }
    if (input.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(input.tags));
    }

    params.push(id);

    await db.runAsync(
      `UPDATE meaning_entries SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
  },

  /**
   * Get an entry by ID
   */
  async getById(id: string): Promise<MeaningEntry | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<MeaningRow>(
      'SELECT * FROM meaning_entries WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return row ? rowToEntry(row) : null;
  },

  /**
   * Get all entries (excluding soft-deleted)
   */
  async getAll(): Promise<MeaningEntry[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MeaningRow>(
      'SELECT * FROM meaning_entries WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    return rows.map(rowToEntry);
  },

  /**
   * Get entries by category
   */
  async getByCategory(category: MeaningCategory): Promise<MeaningEntry[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MeaningRow>(
      'SELECT * FROM meaning_entries WHERE category = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [category]
    );
    return rows.map(rowToEntry);
  },

  /**
   * Soft delete an entry
   */
  async delete(id: string): Promise<void> {
    const db = await getDb();
    const now = nowISO();
    await db.runAsync(
      'UPDATE meaning_entries SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [now, now, id]
    );
  },

  /**
   * Count entries by category
   */
  async countByCategory(): Promise<Record<MeaningCategory, number>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count FROM meaning_entries 
       WHERE deleted_at IS NULL GROUP BY category`
    );
    
    const result: Record<MeaningCategory, number> = {
      meaningful: 0,
      joyful: 0,
      painful_significant: 0,
      empty_numb: 0,
    };
    
    for (const row of rows) {
      if (row.category in result) {
        result[row.category as MeaningCategory] = row.count;
      }
    }
    
    return result;
  },

  /**
   * Get all unique tags with counts
   */
  async getTagCounts(): Promise<{ tag: string; count: number }[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MeaningRow>(
      'SELECT tags FROM meaning_entries WHERE deleted_at IS NULL'
    );
    
    const tagMap = new Map<string, number>();
    for (const row of rows) {
      try {
        const tags = JSON.parse(row.tags);
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            if (typeof tag === 'string' && tag.trim()) {
              const normalized = tag.trim().toLowerCase();
              tagMap.set(normalized, (tagMap.get(normalized) ?? 0) + 1);
            }
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }
    
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Count total entries
   */
  async count(): Promise<number> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM meaning_entries WHERE deleted_at IS NULL'
    );
    return result?.count ?? 0;
  },
};
