Below is a **fresh, agent-sized backlog** aligned to the **latest docs + decisions** (Supabase, multi-device sync, secure-by-design, Expo/RN, local SQLite as cache). It’s designed so agents can: **read docs → install deps → wire skeleton → ship working vertical slices**.

You can copy/paste these into GitHub Issues. Titles are intentionally “commit-sized”.

---

# Backlog v2 (Supabase + Auth + Sync + UI Theme)

## ~~EPIC 0 — Agent onboarding and repo health~~ ✅ COMPLETE

### ~~0.1 `chore: verify required docs present and linked`~~ ✅

### ~~0.2 `chore: install dependencies and lock toolchain`~~ ✅

### ~~0.3 `chore: add env handling (.env.example + loading)`~~ ✅

---

## ~~EPIC 1 — UI foundation (Theme + Layout primitives)~~ ✅ COMPLETE

### ~~1.1 `feat(ui): add theme.ts and styles.ts`~~ ✅

### ~~1.2 `feat(ui): wire Home/Practice/PostPractice screens to navigation`~~ ✅

### ~~1.3 `chore(ui): add minimal UI components (Card, ButtonText, Pill)`~~ ✅

---

## ~~EPIC 2 — Local DB (SQLite cache) + repos~~ ✅ COMPLETE

### ~~2.1 `feat(data): create SQLite schema incl. sync_state`~~ ✅

### ~~2.2 `feat(data): implement repos (practicesRepo, sessionsRepo, meaningRepo)`~~ ✅

### ~~2.3 `feat(data): seed practices into SQLite on first run`~~ ✅

---

## ~~EPIC 3 — "Today's Practice" selection (deterministic)~~ ✅ COMPLETE

### ~~3.1 `feat(domain): deterministic daily practice selection`~~ ✅

**Acceptance:**

* ~~One practice per calendar day~~ ✅
* ~~Stable within a day~~ ✅
* ~~Swap once per day (optional if you want this now)~~ ✅
* ~~No streaks/progress~~ ✅

---

## ~~EPIC 4 — Attention Gym flow (real sessions)~~ ✅ COMPLETE

### ~~4.1 `feat(sessions): create PracticeSession on practice start`~~ ✅

**Acceptance:**

* ~~Session row created with `status=started`~~ ✅
* ~~`started_at` saved~~ ✅

### ~~4.2 `feat(sessions): complete / abandon updates session`~~ ✅

**Acceptance:**

* ~~Finish → `completed_at`, `status=completed`~~ ✅
* ~~Exit/Back → `status=abandoned`~~ ✅
* ~~No praise language~~ ✅

---

## ~~EPIC 5 — Meaning logging (CRUD, tags, UX)~~ ✅ COMPLETE

### ~~5.1 `feat(entries): implement LogMoment screen with category/text/tags`~~ ✅

**Acceptance:**

* Category required
* Text optional max 280
* Tags optional (chip list from comma-separated input is fine)
* Save writes to SQLite

### ~~5.2 `feat(entries): Entries screen list + edit/delete (soft delete locally)`~~ ✅

**Acceptance:**

* List entries
* Edit updates `updated_at`
* Delete sets `deleted_at` (don’t hard delete)

---

## ~~EPIC 6 — Map logic (deterministic + testable)~~ ✅ COMPLETE

### ~~6.1 `feat(map): implement mapStats (tag counts + net_meaning)`~~ ✅

**Acceptance:**

* Matches SPEC section 7
* Deterministic unit tests

### ~~6.2 `feat(map): implement clustering (Jaccard threshold 0.3)`~~ ✅

**Acceptance:**

* Deterministic clusters (max 5)
* Unit tests with known fixtures

### ~~6.3 `feat(ui): Map screen renders top tags + clusters`~~ ✅

**Acceptance:**

* Neutral language (“shows up”, “tends to”)
* Tap cluster → Entries filtered view

---

## ~~EPIC 7 — Supabase backend setup (schema + seed + RLS)~~ ✅ COMPLETE

### ~~7.1 `chore(backend): apply supabase schema migration (RLS)`~~ ✅

**Acceptance:**

* `0001_init.sql` exists in repo and matches decisions
* RLS enabled on user tables
* Practices readable for authenticated users only (recommended)

### ~~7.2 `chore(backend): seed practices into Supabase via migration`~~ ✅

**Acceptance:**

* `0002_seed_practices.sql` exists
* Idempotent upsert
* Clients cannot insert/update practices

### ~~7.3 `test(security): verify RLS with two users`~~ ✅

**Acceptance:**

* Documented steps in SECURITY.md
* Verified user A cannot read/write user B rows

---

## EPIC 8 — Auth (Supabase, multi-provider)

### 8.1 ✅ `feat(auth): add supabase client + session persistence`

**Acceptance:**

* `src/data/supabaseClient.ts`
* Session persists across restart
* No tokens logged

### 8.2 ✅ `feat(auth-ui): Auth screen + gating`

**Acceptance:**

* Logged out → Auth screen
* Logged in → App content
* Logout works

### 8.3 ✅ `feat(auth): Apple sign-in`

**Acceptance:**

* Works on iOS device
* Redirect returns to app
* Session stored

### 8.4 ✅ `feat(auth): Google sign-in`

**Acceptance:** end-to-end working

### 8.5 ✅ `feat(auth): Email sign-in (magic link or OTP)`

**Acceptance:** end-to-end working

### 8.6 `feat(auth): Additional provider (Facebook or alternate)`

**Acceptance:** end-to-end working
*(If provider choice is still open, treat as Facebook by default per DECISIONS.md.)*

### 8.7 ✅ `chore(auth): deep link + redirect URL config`

**Acceptance:**

* `app.json` scheme set (e.g., `margin`)
* Supabase redirect allowlist documented
* iOS + Android tested

---

## EPIC 9 — Sync (minimal, deterministic, secure)

### 9.1 ✅ `feat(sync): add sync skeleton modules + sync_state repo`

**Acceptance:**

* `src/domain/sync/*` exists (engine + stubs)
* `sync_state` local table used for `last_sync_at:*`

### 9.2 ✅ `feat(sync): pull remote changes into SQLite (meaning_entries)`

**Acceptance:**

* Fetch rows updated since last sync
* Upsert local by id
* Respect `deleted_at`

### 9.3 ✅ `feat(sync): push local changes to Supabase (meaning_entries)`

**Acceptance:**

* Upsert to Supabase
* Soft delete via `deleted_at`
* No infinite loops

### 9.4 ✅ `feat(sync): pull/push practice_sessions`

**Acceptance:** same as entries

### 9.5 ✅ `feat(sync): conflict rule (server newer wins by updated_at)`

**Acceptance:**

* Deterministic last-write-wins
* Tested with simulated timestamps

### 9.6 `feat(sync-ui): Settings “Sync now” + sync on start/foreground`

**Acceptance:**

* Manual sync button
* Sync triggers don’t spam network
* Sync safe offline

---

## EPIC 10 — Export & release hygiene

### 10.1 ✅ `feat(export): user-initiated JSON export (local cache)`

**Acceptance:** exports practices/sessions/entries from SQLite

### 10.2 ✅ `chore: add basic error boundaries + safe logging`

**Acceptance:**

* No personal text in logs
* Basic error UI doesn’t add drama

---

# Suggested execution order (keeps agents sane)

1. **EPIC 0 → 2 → 4 → 5 → 6** (local-only vertical slice works)
2. **EPIC 7 → 8** (Supabase + auth)
3. **EPIC 9** (sync)
4. **EPIC 10** (export + hardening)

---

## One practical “agent prompt” to pin in the repo

Add this to the top of each issue (or in your project board description):

> Read `SPEC.md`, `DECISIONS.md`, `AGENTS.md`, `DESIGN.md` first. Implement the smallest change that satisfies acceptance criteria. No streaks, no advice, no ML/LLM, no network dependency in core flow unless the issue is explicitly Auth/Sync.