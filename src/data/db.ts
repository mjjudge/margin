import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initialized = false;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('attention_meaning.db');
  }
  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();
  
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS practices (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      instruction TEXT NOT NULL,
      mode TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      duration_seconds INTEGER,
      contra_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      practice_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT NOT NULL,
      user_rating TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS meaning_entries (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      text TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      time_of_day TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Fragments catalogue cache (mirrors Supabase)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fragments_catalog_cache (
      id TEXT PRIMARY KEY NOT NULL,
      voice TEXT NOT NULL,
      text TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Local fragment reveals (syncs with Supabase)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS fragment_reveals_local (
      id TEXT PRIMARY KEY NOT NULL,
      fragment_id TEXT NOT NULL,
      revealed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      UNIQUE(fragment_id)
    );
  `);

  // Index for efficient reveal queries
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_fragment_reveals_revealed_at 
    ON fragment_reveals_local(revealed_at);
  `);
}

/**
 * Bootstrap the database: init schema + seed practices + seed fragments
 * Safe to call multiple times (idempotent)
 */
export async function bootstrapDb(): Promise<void> {
  if (initialized) return;
  
  await initDb();
  
  // Lazy import to avoid circular dependency
  const { seedPractices, needsSeeding } = await import('./seedPractices');
  
  if (await needsSeeding()) {
    const result = await seedPractices();
    console.log(`[DB] Seeded ${result.seeded} practices`);
  }

  // Seed fragments catalogue if not cached
  const { seedFragmentsFromLocal, needsFragmentsSeeding } = await import('./seedFragments');

  if (await needsFragmentsSeeding()) {
    const result = await seedFragmentsFromLocal();
    console.log(`[DB] Seeded ${result.seeded} fragments`);
  }
  
  initialized = true;
}
