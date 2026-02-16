import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { AppSettings, CarouselImage } from "@/types/content";

function isMissingColumnError(message: string): boolean {
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

  if (!isMissingColumnError(primary.error.message)) {
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
