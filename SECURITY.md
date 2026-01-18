# SECURITY.md
## Practical threat model and controls (MVP + Sync)

This is not a formal security audit. It’s a working checklist.

---

## Assets to protect
- MeaningEntry text (may include sensitive personal content)
- Tags (can reveal patterns)
- PracticeSessions (behavioural data)
- Account identity and sessions

---

## Threats & mitigations

### T1: Cross-user data access (broken auth / broken access control)
**Risk:** A user can read or modify another user’s entries.  
**Controls:**
- RLS enabled on all user tables.
- Policies restrict all operations to `user_id = auth.uid()`.
- No service role key in client app.
**Tests:**
- Create two test users; verify user A cannot read user B rows via API.

### T2: Session/token leakage
**Risk:** Tokens leaked via logs, crash dumps, or insecure storage.  
**Controls:**
- Supabase session stored via AsyncStorage (standard), avoid printing.
- Do not log session objects or headers.
- Avoid analytics SDKs in MVP.
**Tests:**
- Grep logs for “access_token” / “refresh_token”.

### T3: Sensitive content leaking to console / telemetry
**Risk:** MeaningEntry text appears in logs.  
**Controls:**
- No console logging of entry text in production paths.
- Avoid adding analytics/crash reporting until explicit.
**Tests:**
- Manual review: no `console.log(entry.text)` or similar.

### T4: Malicious client writes (tampering)
**Risk:** Client attempts to write invalid data or write as another user.  
**Controls:**
- RLS with `with check (user_id = auth.uid())`.
- DB constraints: text length, allowed enums.
**Tests:**
- Attempt to insert with different `user_id` via client; must fail.

### T5: Sync conflicts causing data loss
**Risk:** Offline edits overwritten incorrectly.  
**Controls:**
- Deterministic last-write-wins with server-newer preference.
- Use `deleted_at` for deletes; avoid hard deletion.
- Stable UUIDs generated client-side.
**Tests:**
- Two devices edit same row; verify predictable resolution and no duplication.

### T6: OAuth redirect hijacking / misconfigured deep links
**Risk:** OAuth flow returns to wrong app or is intercepted.  
**Controls:**
- Use explicit `scheme` and correct redirect URLs in Supabase allowlist.
- Use official provider configuration.
**Tests:**
- Verify OAuth round-trip on real device for Apple/Google.

### T7: Dependency supply chain risks
**Risk:** vulnerable or unmaintained packages.  
**Controls:**
- Minimal dependency policy (DECISIONS.md).
- Dependabot (optional later).
**Tests:**
- `npm audit` (informational; don’t auto-fix blindly).

---

## Security defaults (non-negotiable)
- HTTPS only
- No service role key in client
- RLS mandatory
- No passive data collection in MVP
- User-initiated export only

---
