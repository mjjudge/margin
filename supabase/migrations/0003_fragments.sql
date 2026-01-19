-- 0003_fragments.sql
-- Found Fragments: catalogue table, reveals table, RLS policies, seed data, indexes
-- Idempotent where possible

-- =========================
-- H.1: fragments_catalog table
-- =========================

-- Fragments catalogue is global content (like practices).
-- Users only read fragments. Supabase becomes source of truth.
create table if not exists public.fragments_catalog (
  id text primary key,  -- e.g., "frag_0001"
  voice text not null check (voice in ('observer','pattern_keeper','naturalist','witness')),
  text text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger for fragments_catalog
drop trigger if exists trg_fragments_catalog_updated_at on public.fragments_catalog;
create trigger trg_fragments_catalog_updated_at
before update on public.fragments_catalog
for each row execute function public.set_updated_at();

-- =========================
-- H.2: fragment_reveals table
-- =========================

-- Stores per-user reveal history.
-- Unique constraint on (user_id, fragment_id) ensures no repeats.
create table if not exists public.fragment_reveals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fragment_id text not null references public.fragments_catalog(id) on delete restrict,
  revealed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  
  -- Unique constraint: a fragment can only be revealed once per user
  constraint fragment_reveals_user_fragment_unique unique (user_id, fragment_id)
);

-- =========================
-- H.3: RLS policies
-- =========================

-- fragments_catalog: read-only for authenticated users
alter table public.fragments_catalog enable row level security;

drop policy if exists "fragments_catalog_read_authenticated" on public.fragments_catalog;
create policy "fragments_catalog_read_authenticated"
on public.fragments_catalog
for select
to authenticated
using (true);

-- No insert/update/delete policies for fragments_catalog
-- (only service role can modify)

-- fragment_reveals: user-owned (read, insert, delete own rows)
alter table public.fragment_reveals enable row level security;

drop policy if exists "reveals_select_own" on public.fragment_reveals;
create policy "reveals_select_own"
on public.fragment_reveals
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "reveals_insert_own" on public.fragment_reveals;
create policy "reveals_insert_own"
on public.fragment_reveals
for insert
to authenticated
with check (user_id = auth.uid());

-- Allow delete for account deletion scenarios
drop policy if exists "reveals_delete_own" on public.fragment_reveals;
create policy "reveals_delete_own"
on public.fragment_reveals
for delete
to authenticated
using (user_id = auth.uid());

-- No update policy (reveals are immutable once created)

-- =========================
-- H.5: Indexes
-- =========================

create index if not exists idx_fragment_reveals_user_id on public.fragment_reveals(user_id);
create index if not exists idx_fragment_reveals_user_revealed on public.fragment_reveals(user_id, revealed_at);
create index if not exists idx_fragments_catalog_voice on public.fragments_catalog(voice);
create index if not exists idx_fragments_catalog_enabled on public.fragments_catalog(enabled);

-- =========================
-- H.4: Seed fragments_catalog
-- =========================

-- Idempotent: uses ON CONFLICT DO UPDATE
-- 100 fragments from fragments.seed.json

insert into public.fragments_catalog (id, voice, text, enabled, created_at, updated_at) values
  ('frag_0001', 'observer', E'This happened.\nYou noticed it.\nThat is enough.', true, now(), now()),
  ('frag_0002', 'observer', E'Attention does not change things.\nIt changes what is visible.', true, now(), now()),
  ('frag_0003', 'observer', E'Nothing is required of this moment\nfor it to exist fully.', true, now(), now()),
  ('frag_0004', 'observer', E'You can notice something\nwithout keeping it.', true, now(), now()),
  ('frag_0005', 'observer', E'This is not an exercise.\nIt is an encounter.', true, now(), now()),
  ('frag_0006', 'observer', E'Experience does not wait\nto be understood.', true, now(), now()),
  ('frag_0007', 'observer', E'What you noticed did not ask\nto be noticed.', true, now(), now()),
  ('frag_0008', 'observer', E'There is no correct distance\nfrom what is happening.', true, now(), now()),
  ('frag_0009', 'observer', E'This moment is not improved\nby commentary.', true, now(), now()),
  ('frag_0010', 'observer', E'Seeing something clearly\ndoes not obligate response.', true, now(), now()),
  ('frag_0011', 'observer', E'Awareness is not effort.\nIt is availability.', true, now(), now()),
  ('frag_0012', 'observer', E'Nothing here needs to resolve.', true, now(), now()),
  ('frag_0013', 'observer', E'Noticing is already participation.', true, now(), now()),
  ('frag_0014', 'observer', E'This was real\neven if you say nothing about it.', true, now(), now()),
  ('frag_0015', 'observer', E'You were present.\nThat is the whole account.', true, now(), now()),
  ('frag_0016', 'pattern_keeper', E'Some things arrive once.\nOthers return quietly.', true, now(), now()),
  ('frag_0017', 'pattern_keeper', E'Repetition does not insist.\nIt simply reappears.', true, now(), now()),
  ('frag_0018', 'pattern_keeper', E'Patterns form\nwithout asking permission.', true, now(), now()),
  ('frag_0019', 'pattern_keeper', E'What repeats is not always important.\nBut it is rarely accidental.', true, now(), now()),
  ('frag_0020', 'pattern_keeper', E'A pattern is just a shape\nseen over time.', true, now(), now()),
  ('frag_0021', 'pattern_keeper', E'Noticing recurrence\ndoes not require explanation.', true, now(), now()),
  ('frag_0022', 'pattern_keeper', E'Some things cluster\nwithout belonging together.', true, now(), now()),
  ('frag_0023', 'pattern_keeper', E'Rhythm is not intention.\nIt is timing.', true, now(), now()),
  ('frag_0024', 'pattern_keeper', E'Patterns do not predict.\nThey reveal.', true, now(), now()),
  ('frag_0025', 'pattern_keeper', E'What returns\noften does so unchanged.', true, now(), now()),
  ('frag_0026', 'pattern_keeper', E'You are not required\nto respond to recurrence.', true, now(), now()),
  ('frag_0027', 'pattern_keeper', E'Seeing a pattern\nis not the same as following it.', true, now(), now()),
  ('frag_0028', 'pattern_keeper', E'Some things repeat\nuntil they are noticed.', true, now(), now()),
  ('frag_0029', 'pattern_keeper', E'Frequency is a form of information.', true, now(), now()),
  ('frag_0030', 'pattern_keeper', E'Patterns remain\nwhether or not they are named.', true, now(), now()),
  ('frag_0031', 'naturalist', E'Long before language,\nthere was experience.', true, now(), now()),
  ('frag_0032', 'naturalist', E'Nothing you notice here\nbegan with you.', true, now(), now()),
  ('frag_0033', 'naturalist', E'Awareness did not start\nas a personal trait.', true, now(), now()),
  ('frag_0034', 'naturalist', E'Life has always been\nattentive to itself.', true, now(), now()),
  ('frag_0035', 'naturalist', E'What feels immediate\noften has deep roots.', true, now(), now()),
  ('frag_0036', 'naturalist', E'This way of noticing\nis older than memory.', true, now(), now()),
  ('frag_0037', 'naturalist', E'Experience preceded explanation\nby a long time.', true, now(), now()),
  ('frag_0038', 'naturalist', E'The world did not wait\nfor interpretation to begin.', true, now(), now()),
  ('frag_0039', 'naturalist', E'Attention is not an invention.\nIt is an inheritance.', true, now(), now()),
  ('frag_0040', 'naturalist', E'You are participating\nin something very old.', true, now(), now()),
  ('frag_0041', 'witness', E'Very little is meaningful\non its own.', true, now(), now()),
  ('frag_0042', 'witness', E'What touches you\nis rarely isolated.', true, now(), now()),
  ('frag_0043', 'witness', E'Some moments lean\ntoward others.', true, now(), now()),
  ('frag_0044', 'witness', E'Connection is often felt\nbefore it is recognised.', true, now(), now()),
  ('frag_0045', 'witness', E'Separation is a useful idea.\nNot always a true one.', true, now(), now()),
  ('frag_0046', 'witness', E'What appears distinct\nmay still belong.', true, now(), now()),
  ('frag_0047', 'witness', E'Meaning often arises\nbetween things.', true, now(), now()),
  ('frag_0048', 'witness', E'No moment stands entirely alone.', true, now(), now()),
  ('frag_0049', 'witness', E'What you notice\nalso notices.', true, now(), now()),
  ('frag_0050', 'witness', E'Some recognitions\ndo not need names.', true, now(), now()),
  ('frag_0051', 'observer', E'Nothing needs to be extracted\nfrom this moment.', true, now(), now()),
  ('frag_0052', 'observer', E'You are allowed\nto let this pass unchanged.', true, now(), now()),
  ('frag_0053', 'observer', E'Attention does not demand\nthat something be useful.', true, now(), now()),
  ('frag_0054', 'observer', E'This was complete\nbefore you noticed it.', true, now(), now()),
  ('frag_0055', 'observer', E'Not everything observed\nbecomes part of a story.', true, now(), now()),
  ('frag_0056', 'observer', E'Presence does not accumulate.', true, now(), now()),
  ('frag_0057', 'observer', E'You can notice\nwithout remembering.', true, now(), now()),
  ('frag_0058', 'observer', E'This moment does not ask\nto be carried forward.', true, now(), now()),
  ('frag_0059', 'observer', E'Awareness leaves\nno residue of obligation.', true, now(), now()),
  ('frag_0060', 'observer', E'What is seen clearly\ndoes not require retention.', true, now(), now()),
  ('frag_0061', 'observer', E'This was enough\nwhile it was here.', true, now(), now()),
  ('frag_0062', 'observer', E'You do not need\nto hold this.', true, now(), now()),
  ('frag_0063', 'pattern_keeper', E'Some patterns dissolve\nonce they are recognised.', true, now(), now()),
  ('frag_0064', 'pattern_keeper', E'Not all repetition\nasks for response.', true, now(), now()),
  ('frag_0065', 'pattern_keeper', E'A rhythm can exist\nwithout meaning anything.', true, now(), now()),
  ('frag_0066', 'pattern_keeper', E'What fades\nmay still have mattered.', true, now(), now()),
  ('frag_0067', 'pattern_keeper', E'Patterns change\nwithout announcing it.', true, now(), now()),
  ('frag_0068', 'pattern_keeper', E'Noticing is not control.', true, now(), now()),
  ('frag_0069', 'pattern_keeper', E'Some sequences end\nwithout conclusion.', true, now(), now()),
  ('frag_0070', 'pattern_keeper', E'Absence can also repeat.', true, now(), now()),
  ('frag_0071', 'pattern_keeper', E'What once returned\nmay quietly stop.', true, now(), now()),
  ('frag_0072', 'pattern_keeper', E'Patterns do not require loyalty.', true, now(), now()),
  ('frag_0073', 'pattern_keeper', E'Change often enters\nbetween repetitions.', true, now(), now()),
  ('frag_0074', 'pattern_keeper', E'There is no obligation\nto preserve a pattern.', true, now(), now()),
  ('frag_0075', 'pattern_keeper', E'What no longer appears\nis also information.', true, now(), now()),
  ('frag_0076', 'naturalist', E'You are not late\nto this way of noticing.', true, now(), now()),
  ('frag_0077', 'naturalist', E'This has been happening\nin many forms.', true, now(), now()),
  ('frag_0078', 'naturalist', E'Nothing about this\nis exclusive to you.', true, now(), now()),
  ('frag_0079', 'naturalist', E'Attention has survived\nmany names.', true, now(), now()),
  ('frag_0080', 'naturalist', E'What you experience\nhas many ancestors.', true, now(), now()),
  ('frag_0081', 'naturalist', E'Life learned to notice\nlong before it learned to speak.', true, now(), now()),
  ('frag_0082', 'naturalist', E'You are inside a continuity,\nnot at its centre.', true, now(), now()),
  ('frag_0083', 'naturalist', E'This did not begin\nwith intention.', true, now(), now()),
  ('frag_0084', 'naturalist', E'Awareness persists\nwithout needing to be remembered.', true, now(), now()),
  ('frag_0085', 'naturalist', E'You are a moment\nin a long attentiveness.', true, now(), now()),
  ('frag_0086', 'naturalist', E'This way of being present\nhas outlived many explanations.', true, now(), now()),
  ('frag_0087', 'naturalist', E'You are not separate\nfrom what notices.', true, now(), now()),
  ('frag_0088', 'naturalist', E'Nothing about this\nneeds defending.', true, now(), now()),
  ('frag_0089', 'witness', E'Meaning often arrives\nafter the moment has passed.', true, now(), now()),
  ('frag_0090', 'witness', E'What mattered\nwas never fully contained.', true, now(), now()),
  ('frag_0091', 'witness', E'Some connections\nare felt more than seen.', true, now(), now()),
  ('frag_0092', 'witness', E'You belong\nwithout needing to be included.', true, now(), now()),
  ('frag_0093', 'witness', E'What touches you\nis already in relation.', true, now(), now()),
  ('frag_0094', 'witness', E'No experience is entirely private.', true, now(), now()),
  ('frag_0095', 'witness', E'What moves through you\ndoes not stop there.', true, now(), now()),
  ('frag_0096', 'witness', E'You are part of\nwhat you notice.', true, now(), now()),
  ('frag_0097', 'witness', E'Nothing meaningful\nstands alone for long.', true, now(), now()),
  ('frag_0098', 'witness', E'This moment is held\nby more than you.', true, now(), now()),
  ('frag_0099', 'witness', E'Some forms of knowing\ndo not separate subject and object.', true, now(), now()),
  ('frag_0100', 'witness', E'You are not outside\nof what is happening.', true, now(), now())
on conflict (id) do update set
  voice = excluded.voice,
  text = excluded.text,
  enabled = excluded.enabled,
  updated_at = now();
