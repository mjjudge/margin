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
    fragments_catalog_cache: [],
    fragment_reveals_local: [],
  };

  const mockDb = {
    execAsync: jest.fn(async (sql: string) => {
      // Handle CREATE TABLE - just acknowledge
      if (sql.includes('CREATE TABLE')) {
        return;
      }
      // Handle DELETE (for cleanup)
      if (sql.includes('DELETE FROM')) {
        const tableMatch = sql.match(/DELETE FROM (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          if (!sql.includes('WHERE')) {
            // Full table clear
            tables[table] = [];
          }
        }
      }
    }),
    
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      // Handle DELETE
      if (sql.includes('DELETE FROM')) {
        const tableMatch = sql.match(/DELETE FROM (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          if (sql.includes('WHERE')) {
            // Handle DELETE with WHERE clause
            if (sql.includes('WHERE fragment_id = ?')) {
              tables[table] = tables[table]?.filter((r: Record<string, unknown>) => r.fragment_id !== params[0]) ?? [];
            } else if (sql.includes('WHERE id IN')) {
              // Handle bulk delete
              tables[table] = tables[table]?.filter((r: Record<string, unknown>) => !params.includes(r.id)) ?? [];
            }
          } else {
            // Full table clear
            tables[table] = [];
          }
        }
        return { changes: 1 };
      }

      // Handle INSERT (also matches INSERT OR REPLACE)
      if (sql.includes('INSERT ')) {
        const tableMatch = sql.match(/INSERT (?:OR REPLACE )?INTO (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          // For simplicity, just store params as-is
          if (tables[table]) {
            // Extract column names
            const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/);
            // Extract values (including hardcoded ones like 0, 1, 'string')
            const valMatch = sql.match(/VALUES\s*\(([^)]+)\)/);
            if (colMatch && valMatch) {
              const cols = colMatch[1].split(',').map(c => c.trim());
              const valPatterns = valMatch[1].split(',').map(v => v.trim());
              const row: Record<string, unknown> = {};
              let paramIdx = 0;
              cols.forEach((col, i) => {
                const valPattern = valPatterns[i];
                if (valPattern === '?') {
                  row[col] = params[paramIdx++];
                } else if (valPattern.startsWith("'") && valPattern.endsWith("'")) {
                  // String literal
                  row[col] = valPattern.slice(1, -1);
                } else {
                  // Numeric literal
                  row[col] = parseInt(valPattern, 10);
                }
              });
              
              // Enforce UNIQUE constraint on fragment_id for fragment_reveals_local
              if (table === 'fragment_reveals_local' && !sql.includes('OR REPLACE')) {
                const existing = tables[table].find((r: Record<string, unknown>) => r.fragment_id === row.fragment_id);
                if (existing) {
                  throw new Error(`UNIQUE constraint failed: fragment_reveals_local.fragment_id`);
                }
              }
              
              // Handle INSERT OR REPLACE (upsert)
              if (sql.includes('OR REPLACE')) {
                // For sync_state, use key as identifier
                if (table === 'sync_state') {
                  const existingIdx = tables[table].findIndex((r: Record<string, unknown>) => r.key === row.key);
                  if (existingIdx >= 0) {
                    tables[table][existingIdx] = row;
                  } else {
                    tables[table].push(row);
                  }
                } else {
                  const existing = tables[table].findIndex((r: Record<string, unknown>) => r.id === row.id);
                  if (existing >= 0) {
                    tables[table][existing] = { ...tables[table][existing], ...row };
                  } else {
                    tables[table].push(row);
                  }
                }
              } else if (sql.includes('ON CONFLICT')) {
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
          
          // Handle UPDATE ... SET synced = 1 WHERE id IN (...)
          if (sql.includes('SET synced = 1') && sql.includes('WHERE id IN')) {
            for (const row of tables[table] ?? []) {
              if (params.includes(row.id)) {
                row.synced = 1;
              }
            }
          } else {
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
      }
      
      return { changes: 1 };
    }),
    
    getFirstAsync: jest.fn(async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
      // Handle SELECT COUNT
      if (sql.includes('COUNT(*)')) {
        const tableMatch = sql.match(/FROM (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          let rows = tables[table] ?? [];
          
          // Handle WHERE fragment_id = ?
          if (sql.includes('WHERE fragment_id = ?') && params[0]) {
            rows = rows.filter((r: Record<string, unknown>) => r.fragment_id === params[0]);
          }
          // Handle WHERE revealed_at >= ?
          else if (sql.includes('WHERE revealed_at >= ?') && params[0]) {
            rows = rows.filter((r: Record<string, unknown>) => (r.revealed_at as string) >= (params[0] as string));
          }
          // Filter out deleted for general queries
          else {
            rows = rows.filter((r: Record<string, unknown>) => !r.deleted_at);
          }
          
          return { count: rows.length } as T;
        }
      }
      
      // Handle SELECT ... FROM sync_state WHERE key = ?
      if (sql.includes('FROM sync_state') && sql.includes('WHERE key = ')) {
        // Handle both parameterized and hardcoded key queries
        let keyValue = params[0];
        if (!keyValue) {
          // Try to extract hardcoded key from SQL
          const keyMatch = sql.match(/WHERE key = '([^']+)'/);
          if (keyMatch) {
            keyValue = keyMatch[1];
          }
        }
        const row = tables['sync_state']?.find((r: Record<string, unknown>) => r.key === keyValue);
        return (row as T) ?? null;
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
      
      // Handle SELECT ... ORDER BY ... LIMIT 1 (for getLastReveal)
      if (sql.includes('ORDER BY') && sql.includes('LIMIT 1')) {
        const tableMatch = sql.match(/FROM (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          const rows = [...(tables[table] ?? [])];
          
          // Sort by revealed_at DESC
          if (sql.includes('ORDER BY revealed_at DESC')) {
            rows.sort((a, b) => ((b.revealed_at as string) ?? '').localeCompare((a.revealed_at as string) ?? ''));
          }
          
          return (rows[0] as T) ?? null;
        }
      }
      
      return null;
    }),
    
    getAllAsync: jest.fn(async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
      const tableMatch = sql.match(/FROM (\w+)/);
      if (tableMatch) {
        const table = tableMatch[1];
        let rows = [...(tables[table] ?? [])];
        
        // Filter deleted
        rows = rows.filter((r: Record<string, unknown>) => !r.deleted_at);
        
        // Handle WHERE category = ?
        if (sql.includes('WHERE category = ?') && params[0]) {
          rows = rows.filter((r: Record<string, unknown>) => r.category === params[0]);
        }
        
        // Handle WHERE mode = ?
        if (sql.includes('WHERE mode = ?') && params[0]) {
          rows = rows.filter((r: Record<string, unknown>) => r.mode === params[0]);
        }
        
        // Handle WHERE voice = ? AND enabled = 1
        if (sql.includes('WHERE voice = ?') && sql.includes('enabled = 1')) {
          rows = rows.filter((r: Record<string, unknown>) => r.voice === params[0] && r.enabled === 1);
        }
        
        // Handle WHERE synced = 0
        if (sql.includes('WHERE synced = 0')) {
          rows = rows.filter((r: Record<string, unknown>) => r.synced === 0);
        }
        
        // Handle GROUP BY voice (for counting)
        if (sql.includes('GROUP BY voice')) {
          const grouped: Record<string, number> = {};
          for (const row of rows.filter((r: Record<string, unknown>) => r.enabled === 1)) {
            const voice = row.voice as string;
            grouped[voice] = (grouped[voice] ?? 0) + 1;
          }
          return Object.entries(grouped).map(([voice, count]) => ({ voice, count })) as T[];
        }
        
        // Sort if ORDER BY is present
        if (sql.includes('ORDER BY id')) {
          rows.sort((a, b) => ((a.id as string) ?? '').localeCompare((b.id as string) ?? ''));
        }
        if (sql.includes('ORDER BY revealed_at DESC')) {
          rows.sort((a, b) => ((b.revealed_at as string) ?? '').localeCompare((a.revealed_at as string) ?? ''));
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
      tables.fragments_catalog_cache = [];
      tables.fragment_reveals_local = [];
    },
  };
});
