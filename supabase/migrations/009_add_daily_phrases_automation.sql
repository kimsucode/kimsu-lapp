create table if not exists public.daily_phrases (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  is_active boolean not null default true,
  last_used_at timestamptz,
  times_used integer not null default 0 check (times_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phrase)
);

create index if not exists daily_phrases_active_last_used_idx
on public.daily_phrases (is_active, last_used_at, created_at);

alter table public.app_settings
add column if not exists quote_of_day_mode text not null default 'manual';

alter table public.app_settings
add column if not exists quote_of_day_updated_at timestamptz;

update public.app_settings
set
  quote_of_day_mode = coalesce(quote_of_day_mode, 'manual'),
  quote_of_day_updated_at = coalesce(quote_of_day_updated_at, updated_at)
where quote_of_day is not null;

insert into public.daily_phrases (phrase, created_at, updated_at)
select distinct
  trim(phrase),
  created_at,
  created_at
from public.saved_phrases
where trim(coalesce(phrase, '')) <> ''
on conflict (phrase) do nothing;

create or replace function public.set_daily_phrases_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_phrases_updated_at on public.daily_phrases;

create trigger trg_daily_phrases_updated_at
before update on public.daily_phrases
for each row
execute function public.set_daily_phrases_updated_at();
