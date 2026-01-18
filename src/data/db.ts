import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabase('attention_meaning.db');

export function initDb() {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS practices (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT,
        instruction TEXT,
        mode TEXT,
        difficulty INTEGER,
        duration_seconds INTEGER,
        contra_notes TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        practice_id TEXT,
        started_at TEXT,
        completed_at TEXT,
        status TEXT,
        user_rating TEXT,
        notes TEXT,
        created_at TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS meaning_entries (
        id TEXT PRIMARY KEY NOT NULL,
        category TEXT,
        text TEXT,
        tags TEXT,
        time_of_day TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);
  });
}
