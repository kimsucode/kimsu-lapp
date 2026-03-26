import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getAppSettings } from "@/lib/data";
import { normalizeHomeSectionOrder } from "@/lib/sections";
import { resolveAppleMusicToSpotifyEmbedUrl, toSpotifyEmbedUrl } from "@/lib/spotify";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { QuotePublicationMode } from "@/types/content";

type SettingsPayload = {
  now_playing_title?: string;
  now_playing_artist?: string;
  spotify_embed_url?: string;
  apple_music_url?: string;
  quote_of_day?: string;
  quote_of_day_mode?: QuotePublicationMode;
  latest_article_url?: string;
  editorial_feed_url?: string;
  section_order?: unknown;
};

function asNullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizeFeedUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SettingsPayload;
  const currentSettings = await getAppSettings();

  const hasSpotify = Object.prototype.hasOwnProperty.call(body, "spotify_embed_url");
  const hasAppleMusic = Object.prototype.hasOwnProperty.call(body, "apple_music_url");
  const hasQuote = Object.prototype.hasOwnProperty.call(body, "quote_of_day");
  const hasQuoteMode = Object.prototype.hasOwnProperty.call(body, "quote_of_day_mode");
  const hasLatestArticle = Object.prototype.hasOwnProperty.call(body, "latest_article_url");
  const hasEditorialFeed = Object.prototype.hasOwnProperty.call(body, "editorial_feed_url");
  const hasSectionOrder = Object.prototype.hasOwnProperty.call(body, "section_order");
  const hasNowPlayingTitle = Object.prototype.hasOwnProperty.call(body, "now_playing_title");
  const hasNowPlayingArtist = Object.prototype.hasOwnProperty.call(body, "now_playing_artist");

  const rawSpotify = hasSpotify ? asNullable(body.spotify_embed_url) : currentSettings?.spotify_embed_url ?? null;
  const rawAppleMusic = hasAppleMusic ? asNullable(body.apple_music_url) : null;
  const parsedSpotify = rawSpotify ? toSpotifyEmbedUrl(rawSpotify) : null;
  let spotifyEmbedUrl = parsedSpotify ?? rawSpotify;

  if (hasAppleMusic && !spotifyEmbedUrl && rawAppleMusic) {
    spotifyEmbedUrl = await resolveAppleMusicToSpotifyEmbedUrl(rawAppleMusic);
  }

  if (hasSpotify && rawSpotify && !parsedSpotify && !rawAppleMusic) {
    return NextResponse.json(
      { error: "Lien Spotify invalide. Utilise un lien track/album/playlist Spotify." },
      { status: 400 }
    );
  }

  if (hasAppleMusic && rawAppleMusic && !spotifyEmbedUrl && !parsedSpotify) {
    return NextResponse.json(
      { error: "Impossible de convertir ce lien Apple Music vers Spotify. Vérifie l'URL puis réessaie." },
      { status: 400 }
    );
  }

  const rawFeedUrl = hasEditorialFeed ? asNullable(body.editorial_feed_url) : currentSettings?.editorial_feed_url ?? null;
  const editorialFeedUrl = normalizeFeedUrl(rawFeedUrl);

  if (hasEditorialFeed && rawFeedUrl && !editorialFeedUrl) {
    return NextResponse.json({ error: "URL de flux invalide (utilise http(s))." }, { status: 400 });
  }

  const sectionOrder = hasSectionOrder
    ? normalizeHomeSectionOrder(body.section_order)
    : normalizeHomeSectionOrder(currentSettings?.section_order);

  const supabase = getSupabaseServerClient();
  const nextQuote = hasQuote ? asNullable(body.quote_of_day) : currentSettings?.quote_of_day ?? null;
  const quoteMode = hasQuoteMode ? body.quote_of_day_mode ?? "manual" : currentSettings?.quote_of_day_mode ?? "manual";
  const quoteUpdatedAt = hasQuote || hasQuoteMode ? new Date().toISOString() : currentSettings?.quote_of_day_updated_at ?? null;

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: 1,
      now_playing_title: hasNowPlayingTitle ? asNullable(body.now_playing_title) : currentSettings?.now_playing_title ?? null,
      now_playing_artist: hasNowPlayingArtist ? asNullable(body.now_playing_artist) : currentSettings?.now_playing_artist ?? null,
      spotify_embed_url: spotifyEmbedUrl,
      quote_of_day: nextQuote,
      quote_of_day_mode: quoteMode,
      quote_of_day_updated_at: quoteUpdatedAt,
      latest_article_url: hasLatestArticle ? asNullable(body.latest_article_url) : currentSettings?.latest_article_url ?? null,
      editorial_feed_url: editorialFeedUrl,
      section_order: sectionOrder,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    if (
      error.message.includes("section_order") ||
      error.message.includes("editorial_feed_url") ||
      error.message.includes("quote_of_day_mode") ||
      error.message.includes("quote_of_day_updated_at")
    ) {
      return NextResponse.json(
        {
          error:
            "Colonne manquante dans Supabase (section_order/editorial_feed_url/quote_of_day_mode). Exécute les migrations SQL dans supabase/migrations."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("editorial-feed");
  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}
