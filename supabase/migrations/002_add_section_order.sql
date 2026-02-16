alter table public.app_settings
add column if not exists section_order jsonb not null default '["now_playing","carousel","quote","latest_article"]'::jsonb;

update public.app_settings
set section_order = '["now_playing","carousel","quote","latest_article"]'::jsonb
where section_order is null;
