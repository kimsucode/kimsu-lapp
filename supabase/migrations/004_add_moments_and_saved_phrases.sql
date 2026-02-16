create extension if not exists pgcrypto;

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  now_playing_title text,
  now_playing_artist text,
  spotify_embed_url text,
  daily_phrase text,
  latest_article_url text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_phrases (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  created_at timestamptz not null default now(),
  unique (phrase)
);

create or replace function public.set_moments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_moments_updated_at on public.moments;

create trigger trg_moments_updated_at
before update on public.moments
for each row
execute function public.set_moments_updated_at();
