import { parisDayISO } from "@/lib/date";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { AppSettings, CarouselImage, Moment, SavedPhrase } from "@/types/content";

function isMissingAppSettingsColumn(message: string): boolean {
  return (
    message.includes("column") &&
    (message.includes("editorial_feed_url") || message.includes("section_order"))
  );
}

export async function getAppSettings(): Promise<AppSettings | null> {
  const supabase = getSupabaseServerClient();

  const primary = await supabase
    .from("app_settings")
    .select(
      "id, now_playing_title, now_playing_artist, spotify_embed_url, quote_of_day, latest_article_url, editorial_feed_url, section_order, updated_at"
    )
    .eq("id", 1)
    .maybeSingle();

  if (!primary.error) {
    return primary.data;
  }

  if (!isMissingAppSettingsColumn(primary.error.message)) {
    throw new Error(`Failed to load app settings: ${primary.error.message}`);
  }

  const fallback = await supabase
    .from("app_settings")
    .select("id, now_playing_title, now_playing_artist, spotify_embed_url, quote_of_day, latest_article_url, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (fallback.error) {
    throw new Error(`Failed to load app settings: ${fallback.error.message}`);
  }

  if (!fallback.data) {
    return null;
  }

  return {
    ...fallback.data,
    editorial_feed_url: null,
    section_order: null
  };
}

export async function getCarouselImages(): Promise<CarouselImage[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("carousel_images")
    .select("id, storage_path, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load carousel images: ${error.message}`);
  }

  return data ?? [];
}

export function getPublicImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!base) {
    return "";
  }

  return `${base}/storage/v1/object/public/carousel/${storagePath}`;
}

export async function getFirstCarouselImageUrl(): Promise<string | null> {
  const images = await getCarouselImages();
  if (!images.length) return null;
  return getPublicImageUrl(images[0].storage_path);
}

export async function saveTodayMoment(): Promise<Moment> {
  const settings = await getAppSettings();
  const coverImageUrl = await getFirstCarouselImageUrl();
  const supabase = getSupabaseServerClient();

  const day = parisDayISO();

  const payload = {
    day,
    now_playing_title: settings?.now_playing_title ?? null,
    now_playing_artist: settings?.now_playing_artist ?? null,
    spotify_embed_url: settings?.spotify_embed_url ?? null,
    daily_phrase: settings?.quote_of_day ?? null,
    latest_article_url: settings?.latest_article_url ?? null,
    cover_image_url: coverImageUrl,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("moments")
    .upsert(payload, { onConflict: "day" })
    .select(
      "id, day, now_playing_title, now_playing_artist, spotify_embed_url, daily_phrase, latest_article_url, cover_image_url, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error(`Failed to save today's moment: ${error?.message ?? "Unknown error"}`);
  }

  return data;
}

export async function getMoments(): Promise<Moment[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("moments")
    .select(
      "id, day, now_playing_title, now_playing_artist, spotify_embed_url, daily_phrase, latest_article_url, cover_image_url, created_at, updated_at"
    )
    .order("day", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load moments: ${error.message}`);
  }

  return data ?? [];
}

export async function getMomentById(id: string): Promise<Moment | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("moments")
    .select(
      "id, day, now_playing_title, now_playing_artist, spotify_embed_url, daily_phrase, latest_article_url, cover_image_url, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load moment: ${error.message}`);
  }

  return data;
}

export async function getSavedPhrases(): Promise<SavedPhrase[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("saved_phrases")
    .select("id, phrase, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load saved phrases: ${error.message}`);
  }

  return data ?? [];
}

export async function isPhraseSaved(phrase: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("saved_phrases")
    .select("id")
    .eq("phrase", phrase)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check saved phrase: ${error.message}`);
  }

  return Boolean(data?.id);
}

export async function toggleSavedPhrase(phrase: string): Promise<boolean> {
  const normalized = phrase.trim();
  if (!normalized) {
    throw new Error("Phrase is empty");
  }

  const supabase = getSupabaseServerClient();

  const existing = await supabase
    .from("saved_phrases")
    .select("id")
    .eq("phrase", normalized)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to toggle phrase: ${existing.error.message}`);
  }

  if (existing.data?.id) {
    const remove = await supabase.from("saved_phrases").delete().eq("id", existing.data.id);
    if (remove.error) {
      throw new Error(`Failed to remove saved phrase: ${remove.error.message}`);
    }
    return false;
  }

  const insert = await supabase.from("saved_phrases").insert({ phrase: normalized });
  if (insert.error) {
    throw new Error(`Failed to save phrase: ${insert.error.message}`);
  }

  return true;
}
