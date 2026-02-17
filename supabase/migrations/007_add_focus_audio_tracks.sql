create extension if not exists pgcrypto;

create table if not exists public.focus_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('focus-audio', 'focus-audio', true)
on conflict (id) do update set public = true;
