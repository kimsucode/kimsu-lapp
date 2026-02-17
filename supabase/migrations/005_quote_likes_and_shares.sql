create extension if not exists pgcrypto;

create table if not exists public.quote_likes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (quote_text, fingerprint)
);

create index if not exists idx_quote_likes_quote_text on public.quote_likes (quote_text);

create table if not exists public.quote_share_events (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  channel text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_share_events_quote_text on public.quote_share_events (quote_text);

alter table public.quote_likes enable row level security;
alter table public.quote_share_events enable row level security;

drop policy if exists quote_likes_select_all on public.quote_likes;
create policy quote_likes_select_all
on public.quote_likes
for select
using (true);

drop policy if exists quote_likes_insert_all on public.quote_likes;
create policy quote_likes_insert_all
on public.quote_likes
for insert
with check (true);

drop policy if exists quote_likes_delete_all on public.quote_likes;
create policy quote_likes_delete_all
on public.quote_likes
for delete
using (true);

drop policy if exists quote_share_events_select_all on public.quote_share_events;
create policy quote_share_events_select_all
on public.quote_share_events
for select
using (true);

drop policy if exists quote_share_events_insert_all on public.quote_share_events;
create policy quote_share_events_insert_all
on public.quote_share_events
for insert
with check (true);

grant select, insert, delete on public.quote_likes to anon, authenticated;
grant select, insert on public.quote_share_events to anon, authenticated;
