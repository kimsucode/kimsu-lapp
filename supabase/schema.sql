create table if not exists public.app_settings (
  id integer primary key default 1,
  now_playing_title text,
  now_playing_artist text,
  spotify_embed_url text,
  quote_of_day text,
  latest_article_url text,
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
