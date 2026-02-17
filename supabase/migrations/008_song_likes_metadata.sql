alter table public.song_likes
add column if not exists song_title text,
add column if not exists song_artist text;
