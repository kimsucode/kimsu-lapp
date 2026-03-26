create table if not exists public.app_settings (
  id integer primary key default 1,
  now_playing_title text,
  now_playing_artist text,
  spotify_embed_url text,
  quote_of_day text,
  quote_of_day_mode text not null default 'manual',
  quote_of_day_updated_at timestamptz,
  latest_article_url text,
  editorial_feed_url text,
  section_order jsonb not null default '["now_playing","carousel","quote","latest_article"]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.carousel_images (
  id uuid primary key,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('carousel', 'carousel', true)
on conflict (id) do update set public = true;

create table if not exists public.focus_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_phrases (
  id uuid primary key default gen_random_uuid(),
  phrase text not null unique,
  is_active boolean not null default true,
  last_used_at timestamptz,
  times_used integer not null default 0 check (times_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('focus-audio', 'focus-audio', true)
on conflict (id) do update set public = true;
