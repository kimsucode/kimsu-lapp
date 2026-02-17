create extension if not exists pgcrypto;

create table if not exists public.song_likes (
  id uuid primary key default gen_random_uuid(),
  song_key text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (song_key, fingerprint)
);

create index if not exists idx_song_likes_song_key on public.song_likes (song_key);

create table if not exists public.image_likes (
  id uuid primary key default gen_random_uuid(),
  image_id text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (image_id, fingerprint)
);

create index if not exists idx_image_likes_image_id on public.image_likes (image_id);

alter table public.song_likes enable row level security;
alter table public.image_likes enable row level security;

drop policy if exists song_likes_select_all on public.song_likes;
create policy song_likes_select_all
on public.song_likes
for select
using (true);

drop policy if exists song_likes_insert_all on public.song_likes;
create policy song_likes_insert_all
on public.song_likes
for insert
with check (true);

drop policy if exists song_likes_delete_all on public.song_likes;
create policy song_likes_delete_all
on public.song_likes
for delete
using (true);

drop policy if exists image_likes_select_all on public.image_likes;
create policy image_likes_select_all
on public.image_likes
for select
using (true);

drop policy if exists image_likes_insert_all on public.image_likes;
create policy image_likes_insert_all
on public.image_likes
for insert
with check (true);

drop policy if exists image_likes_delete_all on public.image_likes;
create policy image_likes_delete_all
on public.image_likes
for delete
using (true);

grant select, insert, delete on public.song_likes to anon, authenticated;
grant select, insert, delete on public.image_likes to anon, authenticated;
