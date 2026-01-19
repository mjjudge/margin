# Found Fragments — Domain Module

This module handles the "Found Fragments" feature: short, non-instructional texts that appear rarely (~2/week) over roughly two years.

---

## What this module does

1. **Caches the fragment catalogue** from Supabase for offline access
2. **Decides when/if to reveal a fragment** (release engine)
3. **Tracks reveal history** locally and syncs to Supabase
4. **Ensures no repeats** — a fragment is never shown twice to the same user

---

## Key files

| File | Purpose |
|------|---------|
| `releaseEngine.ts` | Pure function that decides whether to reveal a fragment |
| `fragmentsRepo.ts` | Repository for catalogue cache + reveal history |
| `fragmentTypes.ts` | TypeScript types for fragments |

---

## Invariants (must always hold)

1. **No repeat reveals** — `(user_id, fragment_id)` is unique
2. **Cooldown enforced** — 48 hours minimum between reveals
3. **Rolling cap enforced** — max 2 reveals per 7-day window
4. **Min practices gate** — first fragment requires 3 completed practices
5. **Probability gate** — ~18% chance per eligible opportunity
6. **Offline-first** — reveals recorded locally, then synced

---

## Data flow

```
┌─────────────────────────────────────────────────────┐
│                    Supabase                         │
│  ┌─────────────────┐    ┌─────────────────────┐    │
│  │ fragments_catalog│    │ fragment_reveals    │    │
│  │ (100 fragments) │    │ (per-user history)  │    │
│  └────────┬────────┘    └──────────┬──────────┘    │
└───────────┼─────────────────────────┼──────────────┘
            │ cache                   │ sync
            ▼                         ▼
┌─────────────────────────────────────────────────────┐
│                  Local SQLite                       │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │fragments_catalog_   │  │fragment_reveals_    │  │
│  │cache                │  │local                │  │
│  └────────┬────────────┘  └──────────┬──────────┘  │
└───────────┼──────────────────────────┼─────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────┐
│                 Release Engine                      │
│  Inputs:                                            │
│  - now (timestamp)                                  │
│  - practicesCompleted (count)                       │
│  - firstPracticeAt (timestamp)                      │
│  - lastRevealAt (timestamp | null)                  │
│  - revealsInLast7Days (count)                       │
│  - unrevealedCountsByVoice (map)                    │
│                                                     │
│  Output: { fragmentId } | null                      │
└─────────────────────────────────────────────────────┘
```

---

## Configuration

Config lives in `src/content/fragmentSchedule.seed.json`:

```json
{
  "minPractices": 3,
  "cooldownHours": 48,
  "rollingCapPerWeek": 2,
  "probabilityGate": 0.18,
  "voiceWeights": {
    "early": { "observer": 0.35, "pattern_keeper": 0.30, "naturalist": 0.20, "witness": 0.15 },
    "middle": { "observer": 0.25, "pattern_keeper": 0.30, "naturalist": 0.25, "witness": 0.20 },
    "late": { "observer": 0.20, "pattern_keeper": 0.25, "naturalist": 0.25, "witness": 0.30 }
  }
}
```

---

## Voice definitions

The four voices are **tonal registers**, not characters. They shape how observations are framed, but the user never sees voice labels.

### The Observer (27 fragments)

**Role:** Validates the act of noticing itself. Observation is sufficient without extraction, interpretation, or retention.

**Early phase (frag_0001–0015):** Establishes that noticing is enough. Attention does not demand action.

**Mature phase (frag_0051–0062):** Releases obligation. The user already knows how to look — now they are reminded they don't need to hold onto what they see.

**Tone:** Quiet, present, complete.

---

### The Pattern-Keeper (28 fragments)

**Role:** Notices recurrence without assigning meaning or demanding response. Patterns are shapes, not instructions.

**Early phase (frag_0016–0030):** Repetition exists, can be seen, and does not require explanation.

**Mature phase (frag_0063–0075):** Patterns dissolve, fade, change. No loyalty is required. Absence is also information.

**Tone:** Structural, unhurried, non-insistent.

---

### The Naturalist (23 fragments)

**Role:** Places attention in deep time. The user is participating in something ancient, not performing a personal technique.

**Early phase (frag_0031–0040):** Establishes scale. Attention is older than language, older than memory.

**Mature phase (frag_0076–0088):** Gentler belonging. The user is not late, not separate, not at the centre.

**Tone:** Vast, unhurried, ancestral.

---

### The Witness (22 fragments)

**Role:** Notices connection and meaning between things. Experience is relational, not isolated.

**Early phase (frag_0041–0050):** Interdependence. What touches you is rarely isolated. Meaning arises between things.

**Mature phase (frag_0089–0100):** Awe matures. The user belongs without needing to be included.

**Tone:** Relational, open, held.

---

## Authoring rules (for adding new fragments)

1. **Never prescriptive.** Fragments describe, they do not advise.
2. **Never "you should" / "this will help."** No outcomes promised.
3. **No coupling to user data.** Fragments do not reference practices completed, entries logged, or time spent.
4. **No journey/progress framing.** Fragments are moments, not milestones.
5. **Silence is allowed.** If no fragment is revealed for weeks, that is fine.
6. **No endpoint.** There is no "final fragment" or completion state.

---

## Sync behaviour

### Push (local → remote)

When a fragment is revealed locally:
1. Insert into `fragment_reveals_local` with `synced = false`
2. On next sync, push to Supabase `fragment_reveals`
3. If insert succeeds, mark `synced = true`
4. If insert fails with unique constraint → fragment was already revealed on another device; mark as synced anyway

### Pull (remote → local)

On sync:
1. Fetch all `fragment_reveals` for current user
2. Merge into `fragment_reveals_local`
3. These fragments are now excluded from future selection

---

## Testing checklist

- [ ] Release engine returns null when cooldown not met
- [ ] Release engine returns null when rolling cap reached
- [ ] Release engine returns null when min practices not met
- [ ] Probability gate is respected (seeded RNG test)
- [ ] No fragment is ever revealed twice to same user
- [ ] Conflict handling works when same fragment revealed on two devices offline
- [ ] Voice weights sum to 1.0 per age bucket
