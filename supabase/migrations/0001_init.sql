-- 0001_init.sql
-- Attention Gym + Meaning Maps: initial schema + RLS
-- Assumes Supabase with auth enabled.

-- Extensions (uuid generation)
create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

-- Practices are global content, not user-owned.
-- Users only read practices (public read).
create table if not exists public.practices (
  id uuid primary key,
  title text not null,
  instruction text not null,
  mode text not null check (mode in ('focus','open','somatic','relational','perception')),
  difficulty int not null check (difficulty between 1 and 5),
  duration_seconds int null check (duration_seconds is null or duration_seconds between 30 and 1800),
  contra_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Practice sessions are user-owned.
create table if not exists public.practice_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete restrict,
  started_at timestamptz not null,
  completed_at timestamptz null,
  status text not null check (status in ('started','completed','abandoned')),
  user_rating text null check (user_rating is null or user_rating in ('easy','neutral','hard')),
  notes text null check (notes is null or char_length(notes) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Meaning entries are user-owned.
create table if not exists public.meaning_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('meaningful','joyful','painful_significant','empty_numb')),
  text text null check (text is null or char_length(text) <= 280),
  tags jsonb not null default '[]'::jsonb, -- array of strings
  time_of_day text null check (time_of_day is null or time_of_day in ('morning','afternoon','evening','night')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Optional: local sync state (client-side only) — do NOT create server table unless needed.
-- We'll keep server schema minimal.

-- =========================
-- updated_at trigger
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_practices_updated_at on public.practices;
create trigger trg_practices_updated_at
before update on public.practices
for each row execute function public.set_updated_at();

drop trigger if exists trg_practice_sessions_updated_at on public.practice_sessions;
create trigger trg_practice_sessions_updated_at
before update on public.practice_sessions
for each row execute function public.set_updated_at();

drop trigger if exists trg_meaning_entries_updated_at on public.meaning_entries;
create trigger trg_meaning_entries_updated_at
before update on public.meaning_entries
for each row execute function public.set_updated_at();

-- =========================
-- Indexes (basic)
-- =========================

create index if not exists idx_practice_sessions_user_id on public.practice_sessions(user_id);
create index if not exists idx_practice_sessions_user_updated on public.practice_sessions(user_id, updated_at);
create index if not exists idx_meaning_entries_user_id on public.meaning_entries(user_id);
create index if not exists idx_meaning_entries_user_updated on public.meaning_entries(user_id, updated_at);
create index if not exists idx_meaning_entries_tags_gin on public.meaning_entries using gin (tags);

-- =========================
-- Row Level Security (RLS)
-- =========================

-- Practices: allow read to anyone (including anon) OR only authenticated.
-- Choose ONE posture below. Recommended: authenticated-only.
alter table public.practices enable row level security;

-- Option A: authenticated-only read
drop policy if exists "practices_read_authenticated" on public.practices;
create policy "practices_read_authenticated"
on public.practices
for select
to authenticated
using (true);

-- Optionally allow inserts/updates only via service role (no client policy).
-- (By default, no insert/update policies exist => denied under RLS.)

-- Practice sessions: user-owned
alter table public.practice_sessions enable row level security;

drop policy if exists "sessions_select_own" on public.practice_sessions;
create policy "sessions_select_own"
on public.practice_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "sessions_insert_own" on public.practice_sessions;
create policy "sessions_insert_own"
on public.practice_sessions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "sessions_update_own" on public.practice_sessions;
create policy "sessions_update_own"
on public.practice_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "sessions_delete_own" on public.practice_sessions;
create policy "sessions_delete_own"
on public.practice_sessions
for delete
to authenticated
using (user_id = auth.uid());

-- Meaning entries: user-owned
alter table public.meaning_entries enable row level security;

drop policy if exists "entries_select_own" on public.meaning_entries;
create policy "entries_select_own"
on public.meaning_entries
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "entries_insert_own" on public.meaning_entries;
create policy "entries_insert_own"
on public.meaning_entries
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "entries_update_own" on public.meaning_entries;
create policy "entries_update_own"
on public.meaning_entries
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "entries_delete_own" on public.meaning_entries;
create policy "entries_delete_own"
on public.meaning_entries
for delete
to authenticated
using (user_id = auth.uid());
