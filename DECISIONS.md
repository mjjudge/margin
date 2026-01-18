# DECISIONS.md
## Architectural Decisions (MVP → Sync → Scale)

This document records the key technical decisions for the Attention Gym + Meaning Maps app.
It exists to prevent re-litigating choices and to keep AI agents aligned.

If a future change contradicts a decision here, it must be:
- explicitly approved, and
- recorded as a new decision entry with rationale and migration plan.

---

## Decision 001 — Primary stack: React Native + Expo + TypeScript
**Status:** Accepted  
**Why:** Fast iteration, strong ecosystem, good agent ergonomics, shared code across iOS/Android.

**Implications**
- Keep UI simple; avoid heavy UI kits early.
- Prefer deterministic domain logic in pure TS modules.

---

## Decision 002 — Multi-device data: Cloud database required (not local-only)
**Status:** Accepted  
**Why:** The product requires cross-device continuity. Local-only is not the target.

**Implications**
- Local storage remains useful as a cache and for offline-first UX.
- Sync and identity must be designed early to avoid painful migrations.

---

## Decision 003 — Backend choice: Supabase (Postgres + Auth + RLS)
**Status:** Accepted  
**Why (summary):**
- Postgres is a strong fit for structured entries and querying.
- Supabase Auth supports email and social OAuth.
- Row Level Security (RLS) enables secure-by-default access control at the database layer.

**Implications**
- Data access must be designed around user ownership and RLS policies.
- Keep business rules client-side in MVP, but enforce data security server-side via RLS.

**Non-goals**
- No custom backend service required for MVP unless a specific feature requires it.

---

## Decision 004 — Authentication methods: Apple, Google, Email + one additional provider
**Status:** Accepted  
**Providers**
- Sign in with Apple
- Google
- Email (magic link or OTP; password optional later)
- Additional provider: **Facebook** (or swapable; keep abstraction)

**Notes**
- Apple sign-in is required if you support third-party OAuth on iOS (store policy considerations).
- Email should be available as a universal fallback.

**Implications**
- Auth must be implemented through Supabase Auth.
- UI must keep login minimal and non-pushy.

---

## Decision 005 — Security posture: secure-by-design, defense in depth
**Status:** Accepted  
Security is not an add-on; it is a baseline.

### 5.1 Data ownership model
All user data is owned by a single authenticated user (`user_id`).

Every row in user tables includes:
- `user_id UUID NOT NULL`
- RLS ensures users can only access their rows.

### 5.2 Row Level Security (RLS) is mandatory
- RLS enabled on all user tables.
- Policies:
  - SELECT: only rows where `user_id = auth.uid()`
  - INSERT: must set `user_id = auth.uid()`
  - UPDATE/DELETE: only rows where `user_id = auth.uid()`

### 5.3 No secrets in the client
- Supabase anon public key is allowed in client (normal).
- Service role key never shipped to client.
- Any privileged operation requires server-side function (if ever needed).

### 5.4 Transport security
- All network traffic over HTTPS/TLS.
- Do not introduce non-TLS endpoints.

### 5.5 Logging hygiene
- Never log MeaningEntry text to console in production paths.
- Avoid including personal text in crash logs or analytics (we’re not adding analytics in MVP).

---

## Decision 006 — Data model: local mirrors cloud (sync-friendly)
**Status:** Accepted  
**Why:** Reduces impedance mismatch, makes sync predictable.

### 6.1 Canonical fields
Use the SPEC.md entities as canonical, with cloud additions:
- `user_id`
- `server_created_at`, `server_updated_at` (optional)
- `deleted_at` (for soft delete, optional but recommended for sync)

### 6.2 Tags representation
- Stored as JSON array in Postgres (`jsonb`) OR `text[]`.
- Locally stored as JSON string in SQLite.

**Implications**
- Normalise tags client-side (trim, lowercase optional; decide once and be consistent).

---

## Decision 007 — Offline behavior: offline-capable, not offline-dependent
**Status:** Accepted  
**Meaning:** The app should work without network, but should sync quickly when network exists.

**Approach**
- Local SQLite remains as:
  - cache
  - offline entry capture
  - UI responsiveness
- Cloud becomes source of truth once sync is established.

**Implications**
- Implement a simple sync layer early (see Decision 008).
- Conflict strategy must be defined.

---

## Decision 008 — Sync strategy: simple, deterministic, conflict-minimising
**Status:** Accepted (initial approach)  

### 8.1 Preferred conflict strategy
- **Last-write-wins** using `updated_at` timestamps, with care:
  - client sets `updated_at` on changes
  - server also has `updated_at` via triggers or Supabase `updated_at`

### 8.2 Soft deletion (recommended)
- Use `deleted_at` instead of hard delete for sync safety.
- UI hides deleted rows.
- Purge can happen later.

### 8.3 Idempotent upserts
- Use stable UUIDs generated client-side.
- Sync via upsert by `id` + `user_id`.

**Implications**
- Deterministic sync avoids “clever” conflict resolution.
- Keep a small `sync_state` table locally (e.g., last sync time).

---

## Decision 009 — Backups and recovery
**Status:** Accepted  

### 9.1 Backend
- Supabase/Postgres automatic backups enabled (configure in Supabase).
- Periodic export (e.g., weekly) optional but recommended.

### 9.2 Client
- Provide user-initiated JSON export (already MVP scope).
- Optional: auto-export reminders later (phase 2).

**Implications**
- Treat export as a user feature, not a hidden telemetry channel.

---

## Decision 010 — AI features: not in MVP; only descriptive if added later
**Status:** Accepted  
**Why:** High risk of product drift into advice/coaching.

If AI is introduced:
- must be descriptive
- must cite user’s own entries
- must not recommend actions
- must not use therapy language

Requires separate spec and review.

---

## Decision 011 — “Minimal dependencies” policy
**Status:** Accepted  
**Why:** Fewer dependencies = fewer security risks and less agent-driven drift.

Allowed early:
- Expo core
- React Navigation
- expo-sqlite
- Supabase client (when implementing auth/sync)

Avoid early:
- heavy state frameworks
- UI kits
- analytics SDKs
- ORMs (until proven necessary)

---

## Decision 012 — Implementation sequencing
**Status:** Accepted  

1) MVP offline flows correct (Practice, Log, Map)  
2) Add Supabase Auth (Apple/Google/Email + extra provider)  
3) Add sync layer (upsert + soft delete)  
4) Add multi-device verification tests  
5) Only then consider UI polish and “nice-to-haves”

**Why:** Correctness before convenience.

---

## Notes for AI agents
- Do not propose changing providers or adding telemetry without an explicit issue.
- Assume privacy-sensitive defaults.
- Keep sync logic deterministic and testable.
- If uncertain: implement the smallest safe subset and open an issue.

---
