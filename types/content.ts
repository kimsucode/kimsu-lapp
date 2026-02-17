export type HomeSectionKey = "now_playing" | "carousel" | "quote" | "latest_article";

export type AppSettings = {
  id: number;
  now_playing_title: string | null;
  now_playing_artist: string | null;
  spotify_embed_url: string | null;
  quote_of_day: string | null;
  latest_article_url: string | null;
  editorial_feed_url: string | null;
  section_order: HomeSectionKey[] | null;
  updated_at: string;
};

export type CarouselImage = {
  id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type FocusAudioTrack = {
  id: string;
  label: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type Moment = {
  id: string;
  day: string;
  now_playing_title: string | null;
  now_playing_artist: string | null;
  spotify_embed_url: string | null;
  daily_phrase: string | null;
  latest_article_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedPhrase = {
  id: string;
  phrase: string;
  created_at: string;
};
