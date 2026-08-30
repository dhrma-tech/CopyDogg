-- CopyDogg schema — run against the Supabase project's SQL editor or via `supabase db push`.
-- users are handled by Supabase Auth (auth.users) — no separate users table.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  voice_description text,
  tone_formality int not null default 50,
  tone_humor int not null default 50,
  tone_bluntness int not null default 50,
  tone_warmth int not null default 50,
  emoji_density int not null default 20,
  hashtag_tolerance int not null default 20,
  rules text[] not null default '{}',
  sample_posts text[] not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null
);

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid references personas(id) on delete set null,
  platform text not null,
  prompt_input text not null,
  tone_override text,
  outputs text[] not null,
  chosen_output text,
  feedback smallint,
  saved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists personas_user_id_idx on personas(user_id);
create index if not exists topics_user_id_idx on topics(user_id);
create index if not exists generations_user_id_idx on generations(user_id);
create index if not exists generations_persona_id_idx on generations(persona_id);

-- Row-level security: every table scoped to the owning user.

alter table profiles enable row level security;
alter table personas enable row level security;
alter table topics enable row level security;
alter table generations enable row level security;

create policy "profiles: owner select" on profiles
  for select using (auth.uid() = id);
create policy "profiles: owner insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles: owner update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: owner delete" on profiles
  for delete using (auth.uid() = id);

create policy "personas: owner select" on personas
  for select using (auth.uid() = user_id);
create policy "personas: owner insert" on personas
  for insert with check (auth.uid() = user_id);
create policy "personas: owner update" on personas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "personas: owner delete" on personas
  for delete using (auth.uid() = user_id);

create policy "topics: owner select" on topics
  for select using (auth.uid() = user_id);
create policy "topics: owner insert" on topics
  for insert with check (auth.uid() = user_id);
create policy "topics: owner update" on topics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "topics: owner delete" on topics
  for delete using (auth.uid() = user_id);

create policy "generations: owner select" on generations
  for select using (auth.uid() = user_id);
create policy "generations: owner insert" on generations
  for insert with check (auth.uid() = user_id);
create policy "generations: owner update" on generations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "generations: owner delete" on generations
  for delete using (auth.uid() = user_id);
