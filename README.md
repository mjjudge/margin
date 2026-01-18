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