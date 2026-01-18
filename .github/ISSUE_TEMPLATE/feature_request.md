---
name: Feature (MVP)
about: Add a feature that conforms to SPEC.md
title: "feat: <short descriptive title>"
labels: ["feature", "mvp"]
assignees: []
---

## Summary
Describe the feature in 1–2 sentences.

## SPEC.md references (required)
- Sections:
  - [ ] <e.g., 4.1 Daily loop>
  - [ ] <e.g., 6 Data model>

## Acceptance criteria (required)
- [ ] Item 1 (observable behaviour)
- [ ] Item 2
- [ ] Item 3

## Out of scope (explicit)
- [ ] No streaks / scores / advice / therapy language
- [ ] No ML/LLMs
- [ ] No network dependency for core flow
- [ ] No passive sensing

## Implementation notes (optional)
- Suggested files:
  - `src/...`

## Test plan (required)
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test` (or explain why not available yet)
- Manual:
  - [ ] App boots (`npx expo start`)
  - [ ] Screens/flows tested: <list>
