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
| G | Found Fragments (2-year drip, cross-device) | ✅ |

---

## Active Work

### EPIC 11 — Auth polish & production readiness

#### 11.1 `chore(supabase): enable Apple OAuth provider`

**Acceptance:**
* Apple Sign-In configured in Supabase Dashboard
* Apple Developer account configured with Services ID
* Redirect URL `margin://auth/callback` added to allowed URLs
* Works in production build

#### 11.2 `chore(supabase): enable Google OAuth provider`

**Acceptance:**
* Google OAuth configured in Supabase Dashboard  
* Google Cloud Console OAuth 2.0 credentials created
* Redirect URL `margin://auth/callback` added to allowed URLs
* Works in production build

---

**Status:** Email templates customized ✅ | Deep link handler implemented ✅ | OAuth providers pending