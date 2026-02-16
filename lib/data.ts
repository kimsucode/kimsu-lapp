import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { AppSettings, CarouselImage } from "@/types/content";

export async function getAppSettings(): Promise<AppSettings | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select(
      "id, now_playing_title, now_playing_artist, spotify_embed_url, quote_of_day, latest_article_url, section_order, updated_at"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load app settings: ${error.message}`);
  }

  return data;
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
