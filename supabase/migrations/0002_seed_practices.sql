-- 0002_seed_practices.sql
-- Seed global practices (insert-only via migration)

insert into public.practices (
  id, title, instruction, mode, difficulty, duration_seconds, contra_notes, created_at, updated_at
) values
  -- Example row; add the full list here
  ('b3b9a3b2-7f4e-4e3a-8c5c-1e3c8f1d0a01'::uuid,
   'Five Sounds, No Labels',
   'Notice five distinct sounds. For each one, stay with the raw texture of the sound without naming its source.',
   'perception', 1, 180, null, now(), now())
on conflict (id) do update
set
  title = excluded.title,
  instruction = excluded.instruction,
  mode = excluded.mode,
  difficulty = excluded.difficulty,
  duration_seconds = excluded.duration_seconds,
  contra_notes = excluded.contra_notes,
  updated_at = now();
