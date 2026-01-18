# SPEC.md  
## Attention Gym + Meaning Maps

---

## 0. Purpose of this document

This SPEC defines the **product intent, constraints, data model, and implementation boundaries** for the Attention Gym + Meaning Maps app.

It is written for:
- human developers
- VS Code agents
- GitHub Copilot-style coding agents

Agents **must follow this spec exactly**.  
Deviation without explicit instruction is considered a bug.

---

## 1. Product definition (canonical)

**One-line definition**

> A mobile app that delivers short daily attention practices and captures lightweight “meaning moments” to reveal personal meaning patterns over time.

**What this app is**
- A tool for training attention
- A tool for observing where meaning *actually* appears
- Descriptive, not corrective

**What this app is not**
- A mental health app
- A therapy or coaching app
- A productivity or habit-tracking app
- A happiness or calm optimisation app

---

## 2. Core principles (non-negotiable guardrails)

1. **Descriptive, not prescriptive**
   - The app reveals patterns.
   - It never tells users what they *should* do or value.

2. **No mood optimisation**
   - No promises of calm, happiness, or wellbeing.
   - No anxiety/stress reduction framing.

3. **Completion > outcome**
   - Practices are “complete” when attempted.
   - No scoring of insight or emotional result.

4. **No streak pressure**
   - No streak counters.
   - No “you missed a day” language.

5. **Minimal friction**
   - Logging is optional.
   - Text input is short and bounded.

6. **No clinical framing**
   - No diagnosis.
   - No treatment.
   - No mental health claims.

If an implementation decision conflicts with any principle above, the implementation is wrong.

---

## 3. Target platforms & architecture

### MVP
- React Native (Expo)
- iOS + Android
- Offline-first
- Local SQLite database

### Phase 2 (explicitly out of scope for MVP)
- Cloud sync
- Accounts / login
- Social features
- ML / LLM analysis

---

## 4. Primary user loops

### 4.1 Daily loop (2–6 minutes)

1. User opens app
2. Home screen shows **Today’s Practice**
3. User taps **Start**
4. User reads one instruction
5. Optional timer runs
6. User completes or abandons practice
7. Confirmation screen appears:
   - “Done”
   - Optional prompt: “Log a moment from today?” (skip allowed)

### 4.2 Logging loop (optional)

1. User selects category:
   - Meaningful
   - Joyful
   - Painful but significant
   - Empty / numbed
2. Optional short text (max 280 chars)
3. Optional tags
4. Save

### 4.3 Weekly reflection loop (2–5 minutes)

1. User opens **Map**
2. User views:
   - category patterns
   - tag clusters
   - mixed-salience zones
3. User may tap a cluster to view entries

The app never suggests actions based on these patterns.

---

## 5. Feature set (MVP)

### 5.1 Attention Gym

#### Practice structure
Each practice includes:
- `title`
- `instruction` (1–3 sentences, plain language)
- `mode`
- `difficulty` (1–5)
- optional `duration_seconds`
- optional `contra_notes`

#### Practice modes
- `focus`
- `open`
- `somatic`
- `relational`
- `perception`

#### Content rules
- No mystical language
- No “relax”, “calm”, “heal”, “fix”
- No breathing as a default anchor
- Focus on noticing, not changing

#### Scheduling
- One practice per day
- User may swap once per day
- No streak tracking

---

### 5.2 Meaning Maps

#### Log categories
- `meaningful`
- `joyful`
- `painful_significant`
- `empty_numb`

#### Log rules
- Logging is always optional
- Text input is optional and capped
- Tags are free-form strings
- No numeric ratings

---

## 6. Data model (canonical)

### 6.1 Practice
```ts
Practice {
  id: string
  title: string
  instruction: string
  mode: 'focus' | 'open' | 'somatic' | 'relational' | 'perception'
  difficulty: number // 1..5
  duration_seconds?: number
  contra_notes?: string
  created_at: ISOString
  updated_at: ISOString
}

6.2 PracticeSession
PracticeSession {
  id: string
  practice_id: string
  started_at: ISOString
  completed_at?: ISOString
  status: 'started' | 'completed' | 'abandoned'
  user_rating?: 'easy' | 'neutral' | 'hard'
  notes?: string // max 280 chars
  created_at: ISOString
}

6.3 MeaningEntry
MeaningEntry {
  id: string
  category: 'meaningful' | 'joyful' | 'painful_significant' | 'empty_numb'
  text?: string // max 280 chars
  tags: string[]
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
  created_at: ISOString
  updated_at: ISOString
}

6.4 Derived data

Tag statistics and clusters are computed on demand

No derived data stored in MVP

7. Meaning Map computation (deterministic)
7.1 Constraints

Deterministic

Explainable

No ML

Mobile-safe performance

7.2 Stats

For a date range:

Count tags per category

Compute:

net_meaning(tag) =
  count(tag, meaningful + joyful)
  - count(tag, painful_significant + empty_numb)

7.3 Clustering

Tag co-occurrence clustering

Jaccard similarity

Threshold: 0.3

Max clusters shown: 5

Cluster = tags that frequently appear together in the same entry

8. UX screens (MVP)

Home

Practice

Post-practice confirmation

Log moment

Map

Entries list

Settings

UX language rules

Allowed:

“shows up”

“tends to appear”

“often occurs”

Disallowed:

“should”

“improve”

“fix”

“avoid”

“better/worse”

9. Storage & architecture

SQLite local database

Repository pattern:

practicesRepo

sessionsRepo

meaningRepo

Offline-first

No required network calls in MVP

10. Explicit non-goals (agents must not add)

Streaks or streak loss

Scores for insight or mood

Pushy notifications

Social comparison

AI interpretation or advice

Therapy-style copy

Continuous tracking

Passive sensing (GPS, health data, etc.)

11. Drift risk checklist (for agents)

Agents must not:

Turn the app into mindfulness, CBT, or coaching

Optimise for happiness or calm

Add advice or recommendations

Add hidden gamification

Introduce ML or LLMs in MVP

Store derived map stats

If unsure, default to doing less.

12. MVP acceptance criteria

The MVP is complete when:

A user can complete a daily practice

A user can optionally log a meaning entry

The Map screen shows:

top tags per category

at least one cluster (if data exists)

The app works fully offline

Data can be exported to JSON

No streaks, scores, or advice exist anywhere

13. Phase 2 (explicitly out of scope)

Accounts

Sync

AI reflection

Social features

Custom practice authoring UI

These require a separate spec.