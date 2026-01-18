// src/__tests__/setup.ts
// Jest setup file - mock expo-sqlite for unit tests

// Mock expo-sqlite module
jest.mock('expo-sqlite', () => {
  // In-memory storage for mock database
  const tables: Record<string, Record<string, unknown>[]> = {
    practices: [],
    practice_sessions: [],
    meaning_entries: [],
    sync_state: [],
  };

  const mockDb = {
    execAsync: jest.fn(async (sql: string) => {
      // Handle CREATE TABLE - just acknowledge
      if (sql.includes('CREATE TABLE')) {
        return;
      }
    }),
    
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      // Handle INSERT
      if (sql.includes('INSERT INTO')) {
        const tableMatch = sql.match(/INSERT INTO (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          // For simplicity, just store params as-is
          if (tables[table]) {
            // Extract column names and values
            const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/);
            if (colMatch) {
              const cols = colMatch[1].split(',').map(c => c.trim());
              const row: Record<string, unknown> = {};
              cols.forEach((col, i) => {
                row[col] = params[i];
              });
              
              // Handle ON CONFLICT (upsert)
              if (sql.includes('ON CONFLICT')) {
                const existing = tables[table].findIndex((r: Record<string, unknown>) => r.id === row.id);
                if (existing >= 0) {
                  tables[table][existing] = { ...tables[table][existing], ...row };
                } else {
                  tables[table].push(row);
                }
              } else {
                tables[table].push(row);
              }
            }
          }
        }
      }
      
      // Handle UPDATE
      if (sql.includes('UPDATE')) {
        const tableMatch = sql.match(/UPDATE (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          const id = params[params.length - 1]; // Assume last param is id
          const idx = tables[table]?.findIndex((r: Record<string, unknown>) => r.id === id);
          if (idx !== undefined && idx >= 0) {
            // Simple update - just set updated_at and status if present
            const row = tables[table][idx];
            if (sql.includes('deleted_at')) {
              row.deleted_at = params[0];
            }
            if (sql.includes('status')) {
              row.status = params.find(p => ['completed', 'abandoned'].includes(p as string));
            }
          }
        }
      }
      
      return { changes: 1 };
    }),
    
    getFirstAsync: jest.fn(async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
      // Handle SELECT COUNT
      if (sql.includes('COUNT(*)')) {
        const tableMatch = sql.match(/FROM (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          const rows = tables[table]?.filter((r: Record<string, unknown>) => !r.deleted_at) ?? [];
          return { count: rows.length } as T;
        }
      }
      
      // Handle SELECT by id
      if (sql.includes('WHERE id = ?')) {
        const tableMatch = sql.match(/FROM (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          const row = tables[table]?.find((r: Record<string, unknown>) => r.id === params[0] && !r.deleted_at);
          return (row as T) ?? null;
        }
      }
      
      return null;
    }),
    
    getAllAsync: jest.fn(async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
      const tableMatch = sql.match(/FROM (\w+)/);
      if (tableMatch) {
        const table = tableMatch[1];
        let rows = tables[table]?.filter((r: Record<string, unknown>) => !r.deleted_at) ?? [];
        
        // Handle WHERE category = ?
        if (sql.includes('WHERE category = ?') && params[0]) {
          rows = rows.filter((r: Record<string, unknown>) => r.category === params[0]);
        }
        
        // Handle WHERE mode = ?
        if (sql.includes('WHERE mode = ?') && params[0]) {
          rows = rows.filter((r: Record<string, unknown>) => r.mode === params[0]);
        }
        
        return rows as T[];
      }
      return [];
    }),
  };

  return {
    openDatabaseAsync: jest.fn(async () => mockDb),
    // Export for test access
    __mockTables: tables,
    __resetMock: () => {
      tables.practices = [];
      tables.practice_sessions = [];
      tables.meaning_entries = [];
      tables.sync_state = [];
    },
  };
});
