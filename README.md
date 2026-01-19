## Contributor Note

All development must follow SPEC.md.
If unsure, do less.
Deviation is a bug.

# Attention Gym + Meaning Maps - Application name: "Margin"

## What this app is

This app is an experiment in attention and meaning.

It does two things:
1. It offers short daily practices that train attention.
2. It records brief moments from daily life to reveal where meaning actually appears over time.

It does not try to improve mood, optimise happiness, or offer advice.  
It is descriptive, not corrective.

---

## Why this exists

Most of daily experience is filtered by habit, prediction, and distraction.  
Attention narrows. Meaning becomes assumed rather than noticed.

This app is built on two simple ideas:
- Attention is trainable.
- Meaning is something that shows up, not something you decide in advance.

By training attention and then observing what attention reveals, the app helps users see patterns in what they care about — including where effort, joy, discomfort, and numbness appear.

---

## Core components

### Attention Gym

The Attention Gym provides short practices (2–5 minutes) designed to:
- reduce automatic filtering
- increase perceptual clarity
- notice sensation, impulse, and reaction more precisely

Practices are simple instructions:
- no music
- no guided narratives
- no promises of calm or wellbeing

A practice is complete when it is attempted.  
There is no scoring and no streak tracking.

---

### Meaning Maps

Meaning Maps capture brief moments from daily life.

Users can log moments that felt:
- meaningful
- joyful
- painful but significant
- empty or numbed

Logs are lightweight:
- optional short text
- optional tags
- no ratings or scoring

Over time, the app visualises patterns:
- where meaning tends to appear
- where discomfort and value overlap
- where numbness clusters

The app does not interpret these patterns or suggest actions.

---

## What this app is not

- Not a mental health app
- Not therapy or coaching
- Not mindfulness training
- Not productivity tracking
- Not habit optimisation
- Not a social platform

It makes no clinical claims and offers no advice.

---

## Design principles

- **Descriptive, not prescriptive**  
  The app shows patterns; it does not tell users what to change.

- **Completion over outcome**  
  Practices are done by showing up, not by achieving a result.

- **Minimal friction**  
  Logging is optional. Text is short. Nothing is mandatory.

- **No pressure loops**  
  No streaks, no scores, no loss framing.

- **Offline-first**  
  The app works without an account or network connection.

---

## Technical overview (MVP)

- React Native (Expo)
- TypeScript
- SQLite local storage
- Deterministic map computations
- No machine learning
- No backend services

See `SPEC.md` for canonical implementation details.

---

## Testing

### Running tests

```bash
npm test                    # Run all tests in watch mode
npm test -- --watchAll=false  # Run once (CI mode)
npm test -- --testNamePattern="pattern"  # Run specific tests
```

### Test architecture

Tests use Jest with an in-memory mock of `expo-sqlite`. The mock lives in [src/__tests__/setup.ts](src/__tests__/setup.ts) and is configured via `jest.config.js`.

**Key files:**
- `src/__tests__/setup.ts` - Mock database implementation
- `src/__tests__/repos/*.test.ts` - Repository tests
- `src/__tests__/domain/*.test.ts` - Domain logic tests
- `src/domain/*/___tests__/*.test.ts` - Co-located domain tests

### How the SQLite mock works

The mock maintains in-memory tables as arrays of objects:

```typescript
const tables: Record<string, Record<string, unknown>[]> = {
  practices: [],
  practice_sessions: [],
  meaning_entries: [],
  sync_state: [],
  fragments_catalog_cache: [],
  fragment_reveals_local: [],
};
```

It intercepts `runAsync`, `getFirstAsync`, `getAllAsync`, and `execAsync` calls and simulates SQL operations against these arrays.

### Adding new tables to the mock

1. **Add the table to the tables object** in `setup.ts`:
   ```typescript
   const tables = {
     // ... existing tables
     my_new_table: [],
   };
   ```

2. **Add to the reset function**:
   ```typescript
   __resetMock: () => {
     // ... existing resets
     tables.my_new_table = [];
   },
   ```

3. **Add query handlers if needed** - The mock handles common patterns automatically, but complex queries may need explicit handling in `getAllAsync` or `getFirstAsync`.

### Common gotchas and solutions

#### 1. `INSERT OR REPLACE` vs `INSERT INTO`

The mock checks for `sql.includes('INSERT ')` (with space) to catch both `INSERT INTO` and `INSERT OR REPLACE INTO`. The table extraction regex uses:

```typescript
const tableMatch = sql.match(/INSERT (?:OR REPLACE )?INTO (\w+)/);
```

#### 2. Hardcoded values in SQL

When SQL contains hardcoded values like:
```sql
VALUES ('my_key', ?)
-- or
VALUES (?, ?, ?, ?, 0)
```

The mock parses both parameterized (`?`) and literal values:

```typescript
if (valPattern === '?') {
  row[col] = params[paramIdx++];
} else if (valPattern.startsWith("'") && valPattern.endsWith("'")) {
  row[col] = valPattern.slice(1, -1);  // String literal
} else {
  row[col] = parseInt(valPattern, 10);  // Numeric literal
}
```

#### 3. Unique constraints

To enforce unique constraints in tests, add explicit checks:

```typescript
if (table === 'fragment_reveals_local' && !sql.includes('OR REPLACE')) {
  const existing = tables[table].find(r => r.fragment_id === row.fragment_id);
  if (existing) {
    throw new Error(`UNIQUE constraint failed: fragment_reveals_local.fragment_id`);
  }
}
```

#### 4. Resetting state between tests

Always call `__resetMock()` in `beforeEach`:

```typescript
const expoSqlite = jest.requireMock('expo-sqlite') as {
  __resetMock: () => void;
};

beforeEach(() => {
  expoSqlite.__resetMock();
});
```

#### 5. Query pattern matching

Add WHERE clause handlers in `getAllAsync` as needed:

```typescript
if (sql.includes('WHERE synced = 0')) {
  rows = rows.filter(r => r.synced === 0);
}
```

### Writing good repository tests

1. **Test CRUD operations** - create, read, update, delete
2. **Test edge cases** - empty tables, missing records, duplicates
3. **Test invariants** - unique constraints, required fields
4. **Test sync-related methods** - unsynced tracking, merge logic

Example test structure:

```typescript
describe('myRepo', () => {
  beforeEach(() => {
    expoSqlite.__resetMock();
  });

  it('should create a record', async () => {
    const record = await myRepo.create({ field: 'value' });
    expect(record.id).toBeDefined();
  });

  it('should return null for non-existent record', async () => {
    const record = await myRepo.getById('non-existent');
    expect(record).toBeNull();
  });
});
```

### Domain logic tests

Domain tests (like `releaseEngine.test.ts`) should test pure functions without database dependencies:

- Test configuration validation
- Test deterministic outputs with fixed inputs
- Test edge cases and boundary conditions
- Test invariants (e.g., weights sum to 1.0)

---

## Repository structure

/src
/data # database and repositories
/domain # models and map logic
/ui # screens and components
/content # practice seed data
SPEC.md
README.md


---

## Guardrails for contributors and agents

All development must follow `SPEC.md`.

In particular:
- Do not add streaks, scores, or advice
- Do not introduce therapy or wellbeing language
- Do not add ML or LLMs in MVP
- Do not store derived data
- When unsure, prefer doing less

Deviation from the spec is considered a bug.

---

## Status

This project is under active development.  
The MVP is focused on correctness, clarity, and restraint rather than feature breadth.