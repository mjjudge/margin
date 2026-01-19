# Margin App Backlog

> Read `SPEC.md`, `DECISIONS.md`, `AGENTS.md`, `DESIGN.md` first. Implement the smallest change that satisfies acceptance criteria. No streaks, no advice, no ML/LLM, no network dependency in core flow unless the issue is explicitly Auth/Sync.

---

## Completed EPICs (v1 Foundation)

| EPIC | Description | Status |
|------|-------------|--------|
| 0 | Agent onboarding & repo health | ✅ |
| 1 | UI foundation (Theme + Layout) | ✅ |
| 2 | Local DB (SQLite) + repos | ✅ |
| 3 | Daily practice selection | ✅ |
| 4 | Attention Gym sessions | ✅ |
| 5 | Meaning logging | ✅ |
| 6 | Map stats & clustering | ✅ |
| 7 | Supabase backend | ✅ |
| 8 | Authentication | ✅ |
| 9 | Sync engine | ✅ |
| 10 | Export & error boundaries | ✅ |
| A | Maps v1 (time filter + prominence) | ✅ |
| B | Daily practice loop | ✅ |
| C | Logging UX polish | ✅ |
| D | Reliability & observability | ✅ |
| E | Security, privacy & exit paths | ✅ |
| F | Visual & brand integration | ✅ |

---

## EPIC 11 — Auth polish & production readiness

### 11.1 `chore(supabase): enable Apple OAuth provider`

**Acceptance:**
* Apple Sign-In configured in Supabase Dashboard
* Apple Developer account configured with Services ID
* Redirect URL `margin://auth/callback` added to allowed URLs
* Works in production build

### 11.2 `chore(supabase): enable Google OAuth provider`

**Acceptance:**
* Google OAuth configured in Supabase Dashboard  
* Google Cloud Console OAuth 2.0 credentials created
* Redirect URL `margin://auth/callback` added to allowed URLs
* Works in production build

### 11.3 `chore(supabase): customise email templates`

**Acceptance:**
* "Confirm your sign-up" email includes Margin branding
* Redirect URL points to `margin://auth/callback`
* Email copy matches app tone (no "fix", "improve", etc.)

### 11.4 `feat(auth): deep link handler for auth callbacks`

**Acceptance:**
* App handles `margin://auth/callback` deep links
* Magic link and OAuth callbacks work in production build
* Linking config in app.json/app.config.js

---

## EPIC G — Found Fragments: Product & Documentation

> Make Found Fragments "real" by documenting intent, constraints, and guardrails.

### G.1 `docs(spec): add Found Fragments section to SPEC.md`

**Acceptance:**
* New section "Found Fragments" in SPEC.md
* Defines intent: optional, non-instructional "found notes"
* Defines constraints: no advice, no streaks, no archive/list, silence is allowed, no repeats per user
* Defines surfacing: max 1 at a time; disappears after dismiss/next screen; no backlog

### G.2 `docs(notes): add Found Fragments rationale to notes.md`

**Acceptance:**
* Rationale: why "found notes", why "two-year drip", why "no repeats", why "no endpoint"
* Aesthetic guidance: parchment/scrap feel, "found in a book"

### G.3 `docs(agents): add fragment-specific guardrails to AGENTS.md`

**Acceptance:**
* Never prescriptive language
* Never "you should" / "this will help"
* No coupling fragments to user data
* No "journey/progress" UI

### G.4 `docs(domain): create src/domain/fragments/README.md`

**Acceptance:**
* What the engine does, invariants, where config lives, what gets synced
* Voice definitions and authoring guidelines (see VOICES section below)

---

## EPIC H — Found Fragments: Supabase Schema & Policies

> Supabase becomes source of truth for fragment catalogue.

### H.1 `feat(supabase): create fragments_catalog table`

**Acceptance:**
* Table stores canonical fragment definitions (100 rows)
* Columns: id, voice, text, enabled, created_at, updated_at

### H.2 `feat(supabase): create fragment_reveals table`

**Acceptance:**
* Stores per-user reveal history
* Columns: id, user_id, fragment_id, revealed_at
* Unique constraint on (user_id, fragment_id) — server guarantees "no repeats"

### H.3 `feat(supabase): enable RLS + add policies`

**Acceptance:**
* fragments_catalog: read-only for authenticated users
* fragment_reveals: users can read/insert/delete their own rows

### H.4 `chore(supabase): seed fragments_catalog`

**Acceptance:**
* SQL migration seeds all 100 fragments from fragments.seed.json
* Idempotent (can be run multiple times safely)

### H.5 `chore(supabase): add indexes for performance`

**Acceptance:**
* Index on fragment_reveals(user_id, revealed_at)

---

## EPIC I — Found Fragments: Local Cache & Migrations

> Offline-first: cache catalogue locally and record reveals locally first.

### I.1 `feat(db): add local SQLite tables for fragments`

**Acceptance:**
* fragments_catalog_cache (mirrors Supabase catalog)
* fragment_reveals_local (local reveal history; synced)

### I.2 `feat(domain): implement cache refresh logic`

**Acceptance:**
* Download catalog if missing
* Refresh if remote catalog version changed (simple version field)

---

## EPIC J — Found Fragments: Release Engine (Domain Logic)

> Pure algorithm that decides when/if to reveal a fragment.

### J.1 `feat(content): create fragmentSchedule.seed.json`

**Acceptance:**
* Algorithm config: min practices, cooldown hours, rolling cap, probability gate
* Voice weights by age buckets

### J.2 `feat(domain): implement releaseEngine.ts`

**Acceptance:**
* Pure function with inputs: now, practicesCompleted, firstPracticeAt, lastRevealAt, revealsInLast7Days, unrevealedCountsByVoice
* Output: either null or { fragmentId }
* Constraints enforced:
  - min practices: 3
  - cooldown: 48h since last reveal
  - rolling cap: max 2 per 7 days
  - probability gate per eligible open (~0.18)
  - voice weighting by age buckets

### J.3 `feat(domain): selection uses only unrevealed fragments`

**Acceptance:**
* Selection considers local view + remote reconciliation
* Never selects a fragment already revealed to this user

---

## EPIC K — Found Fragments: Repository & Sync Integration

> Repository layer + sync engine integration.

### K.1 `feat(repo): create fragmentsRepo.ts`

**Acceptance:**
* `ensureCatalogCached()` — download catalog if needed
* `getUnrevealedByVoiceCounts()` — count unrevealed fragments per voice
* `getRecentReveals(days)` — get reveals in last N days
* `tryRevealNext(now)` — returns fragment (or null)
* `markRevealed(fragmentId, revealedAt)` — local + enqueue remote

### K.2 `feat(sync): extend sync engine for fragment_reveals`

**Acceptance:**
* Push local pending reveals
* Pull remote reveals and merge into local

### K.3 `feat(sync): conflict handling for offline multi-device`

**Acceptance:**
* If remote insert fails due to unique constraint → treat as "already revealed elsewhere"
* Ensure fragment won't be shown again locally

---

## EPIC L — Found Fragments: UI Integration

> Surface fragments in the app.

### L.1 `feat(ui): create FoundFragmentCard.tsx`

**Acceptance:**
* Parchment/scrap aesthetic: warm background, subtle grain, inset margins
* No labels (voice/type hidden from user)
* Dismissable

### L.2 `feat(ui): surface fragments on HomeScreen or PostPractice`

**Acceptance:**
* Show opportunistically when engine returns a fragment
* No archive / no list — once dismissed, gone
* Only one fragment visible at a time

### L.3 `feat(settings): add "Show found notes" toggle`

**Acceptance:**
* Default: on
* OFF means: don't show, don't backfill later

---

## EPIC M — Found Fragments: Tests

> Ensure correctness and invariants.

### M.1 `test: config validation`

**Acceptance:**
* Weights sum to 1 per bucket

### M.2 `test: invariants`

**Acceptance:**
* Never repeat locally
* Respects cooldown + rolling cap
* Handles remote uniqueness conflicts

### M.3 `test: seeded RNG tests`

**Acceptance:**
* Stable outcomes in unit tests with seeded random

---

## Voice Definitions (for EPIC G.4)

The fragment voices represent different perspectives on attention and meaning. They are **not** characters that speak to the user — they are tonal registers that shape how observations are framed.

### The Observer (27 fragments: 15 early + 12 mature)

**Role:** Validates the act of noticing itself. Emphasises that observation is sufficient without extraction, interpretation, or retention.

**Early phase (frag_0001–0015):** Establishes that noticing is enough. Introduces the idea that attention does not demand action.

**Mature phase (frag_0051–0062):** Releases obligation. The user already knows how to look — now they are reminded they don't need to hold onto what they see.

**Guardrails:**
* Never implies the user should do more
* Never suggests observation leads to improvement
* Tone: quiet, present, complete

### The Pattern-Keeper (28 fragments: 15 early + 13 mature)

**Role:** Notices recurrence without assigning meaning or demanding response. Patterns are shapes, not instructions.

**Early phase (frag_0016–0030):** Introduces the idea that repetition exists, can be seen, and does not require explanation.

**Mature phase (frag_0063–0075):** Softens. Patterns dissolve, fade, change. No loyalty is required. Absence is also information.

**Guardrails:**
* Never suggests patterns should be acted upon
* Never implies patterns predict or prescribe
* Tone: structural, unhurried, non-insistent

### The Naturalist (23 fragments: 10 early + 13 mature)

**Role:** Places attention in deep time. The user is participating in something ancient, not performing a personal technique.

**Early phase (frag_0031–0040):** Establishes scale. Attention is older than language, older than memory.

**Mature phase (frag_0076–0088):** Gentler belonging. The user is not late, not separate, not at the centre. Nothing about this needs defending.

**Guardrails:**
* Never implies the user is special or chosen
* Never frames attention as achievement
* Tone: vast, unhurried, ancestral

### The Witness (22 fragments: 10 early + 12 mature)

**Role:** Notices connection and meaning between things. Experience is relational, not isolated.

**Early phase (frag_0041–0050):** Introduces interdependence. What touches you is rarely isolated. Meaning arises between things.

**Mature phase (frag_0089–0100):** Awe matures. The user belongs without needing to be included. Some forms of knowing do not separate subject and object.

**Guardrails:**
* Never suggests the user should seek connection
* Never implies loneliness is a problem to solve
* Tone: relational, open, held

---

## Fragment Authoring Rules (all voices)

1. **Never prescriptive.** Fragments describe, they do not advise.
2. **Never "you should" / "this will help."** No outcomes promised.
3. **No coupling to user data.** Fragments do not reference practices completed, entries logged, or time spent.
4. **No journey/progress framing.** Fragments are moments, not milestones.
5. **Silence is allowed.** If no fragment is revealed for weeks, that is fine.
6. **No endpoint.** There is no "final fragment" or completion state.
