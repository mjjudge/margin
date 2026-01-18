# AGENTS.md
## Repository Rules for AI Agents and Contributors

This file defines **non-negotiable working rules** for AI coding agents and human contributors.
If any instruction conflicts with this file, **this file wins** (except where SPEC.md is stricter for product intent).

**Core references**
- Product intent + constraints: `SPEC.md` (canonical)
- Deeper intent: `notes.md`
- This file: build discipline + workflow guardrails

---

## 1) Golden rules (do not break these)

1. **Follow SPEC.md exactly.**
   - If SPEC.md doesn’t mention it, assume it’s out of scope.
   - If uncertain, implement the smallest thing that satisfies the SPEC.

2. **No product drift.**
   - No streaks, scores, advice, therapy framing, ML/LLMs in MVP.
   - No network dependency for core flows in MVP.

3. **Prefer clarity over cleverness.**
   - Keep modules small, explicit, and boring.
   - Avoid introducing new frameworks/libraries unless requested.

4. **One change per PR/commit where possible.**
   - Keep diffs reviewable and reversible.

---

## 2) Required workflow (every change)

### 2.1 Plan → Change → Validate → Commit
Before coding:
- Identify the SPEC.md section(s) you’re implementing.
- List files you expect to touch.

After coding:
- Run required checks (see section 7).
- Update docs if behaviour changed.

Commit:
- Make a commit with a conventional message.
- Include what changed and why.

### 2.2 “Docs are part of the code”
If your change affects behaviour, you must update:
- `SPEC.md` if the spec is changing (rare; must be explicit)
- `README.md` if usage/setup changes
- `notes.md` if it changes the philosophical posture (rare)

**Rule:** If you changed behaviour without updating docs, the work is incomplete.

---

## 3) Code reuse and modularity rules

1. **Re-use existing modules first.**
   - Before adding a new module, search the repo for similar logic.
2. **No duplicate logic across screens.**
   - Business rules belong in `src/domain/*` or `src/data/*`
   - UI screens should call repos/domain functions, not reimplement them.
3. **Repository pattern is mandatory.**
   - DB access only via `src/data/repos/*`.
4. **Derived data is computed, not stored (MVP).**
   - Map stats/clusters must be computed on demand.

---

## 4) Security & privacy baseline (MVP)

This app is offline-first. Security still matters.

### 4.1 Data minimisation
- Do not add GPS, contacts, health, microphone, camera usage in MVP.
- Do not add analytics/telemetry without explicit instruction.
- Do not collect device identifiers.

### 4.2 Local data handling
- Treat user data as sensitive by default.
- Keep exports explicit (user initiated).
- Avoid logging personal entry text to console in production.

### 4.3 Dependencies
- Minimise dependencies.
- Avoid unmaintained packages.
- No remote code execution.
- No dynamic eval.

### 4.4 Future (Phase 2)
If/when cloud sync is introduced, it must include:
- authentication
- encryption-in-transit
- clear privacy language
- threat model review

---

## 5) Data integrity rules

1. **Idempotent seeding**
   - Practice seeding must not duplicate rows on relaunch.
2. **Stable IDs**
   - Do not regenerate practice IDs.
3. **Tags storage**
   - Tags stored as JSON string in SQLite (MVP).
   - Always parse/stringify safely and handle invalid data.
4. **Determinism**
   - Map computations must be deterministic.
   - If any randomisation is used, it must be seeded and documented (prefer none).

---

## 6) UX/copy rules (must comply)

### 6.1 Tone constraints (MVP)
Allowed:
- “shows up”
- “tends to appear”
- “often occurs”

Disallowed:
- “should”
- “fix”
- “heal”
- “improve your mental health”
- “reduce anxiety”
- “be better”

### 6.2 No pressure loops
- No streaks
- No “you missed a day”
- No guilt framing
- No scoreboards

---

## 7) Testing and validation (required)

### 7.1 Minimum checks for every PR/commit
- `npm test` (if configured) OR run unit tests for modified modules
- Typecheck: `npm run typecheck` (add if missing)
- Lint: `npm run lint` (add if missing)
- App boots: `npx expo start` (manual sanity)

### 7.2 Required unit tests (when applicable)
- Map stats determinism tests
- Clustering determinism tests
- Repo CRUD tests (basic)

If tests are not in place yet, create them as part of the task.

---

## 8) Backups, commits, and daily hygiene

### 8.1 Commit discipline
- Commit early and often.
- Prefer small commits with clear messages.
- If a change spans multiple concerns, split into multiple commits.

### 8.2 Daily backup rule
At minimum, ensure:
- Local work is pushed to the remote repository daily, OR
- A patch file is generated and stored (fallback)

If working in a branch, push the branch daily.

### 8.3 Branching
- Use feature branches: `feat/<short-name>` or `fix/<short-name>`
- Avoid long-lived branches. Merge frequently.

---

## 9) Issue execution format (for agents)

When implementing an issue, output must include:
1. SPEC.md sections referenced
2. Files changed
3. Summary of behaviour change
4. Test plan + test results
5. Any follow-up issues discovered

If any item is missing, the work is incomplete.

---

## 10) Library policy (MVP)

Allowed (already approved):
- Expo
- React Navigation
- expo-sqlite

Avoid adding:
- state management frameworks (unless requested)
- ORMs (unless requested)
- UI component libraries (unless requested)

If you believe a new dependency is required:
- justify it in the PR description
- include alternatives considered
- keep it minimal

---

## 11) “Stop conditions” (when to pause and ask)

Agents must stop and ask (or open a GitHub issue) if:
- The change would violate SPEC.md constraints
- The change requires additional permissions (GPS, microphone, etc.)
- The change introduces network reliance for MVP
- The change requires new dependencies outside the allowed set
- The change affects user data export/import semantics

If you cannot ask, implement the smallest safe subset and leave a TODO + issue.

---

## 12) Definition of Done (DoD) for any feature

A feature is done when:
- It matches SPEC.md and does not introduce drift
- Tests exist or were updated
- Docs reflect behaviour
- Code is reused where appropriate
- No new security/privacy risks were introduced
- Changes are committed and pushed

---