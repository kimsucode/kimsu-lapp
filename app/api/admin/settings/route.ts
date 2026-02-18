import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { normalizeHomeSectionOrder } from "@/lib/sections";
import { resolveAppleMusicToSpotifyEmbedUrl, toSpotifyEmbedUrl } from "@/lib/spotify";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type SettingsPayload = {
  now_playing_title?: string;
  now_playing_artist?: string;
  spotify_embed_url?: string;
  apple_music_url?: string;
  quote_of_day?: string;
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

  const rawSpotify = asNullable(body.spotify_embed_url);
  const rawAppleMusic = asNullable(body.apple_music_url);

  const parsedSpotify = rawSpotify ? toSpotifyEmbedUrl(rawSpotify) : null;
  let spotifyEmbedUrl = parsedSpotify;

  if (!spotifyEmbedUrl && rawAppleMusic) {
    spotifyEmbedUrl = await resolveAppleMusicToSpotifyEmbedUrl(rawAppleMusic);
  }

  if (rawSpotify && !parsedSpotify && !rawAppleMusic) {
    return NextResponse.json(
      { error: "Lien Spotify invalide. Utilise un lien track/album/playlist Spotify." },
      { status: 400 }
    );
  }

  if (rawAppleMusic && !spotifyEmbedUrl && !parsedSpotify) {
    return NextResponse.json(
      { error: "Impossible de convertir ce lien Apple Music vers Spotify. Vérifie l'URL puis réessaie." },
      { status: 400 }
    );
  }

  const rawFeedUrl = asNullable(body.editorial_feed_url);
  const editorialFeedUrl = normalizeFeedUrl(rawFeedUrl);

  if (rawFeedUrl && !editorialFeedUrl) {
    return NextResponse.json({ error: "URL de flux invalide (utilise http(s))." }, { status: 400 });
  }

  const sectionOrder = normalizeHomeSectionOrder(body.section_order);

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: 1,
      now_playing_title: asNullable(body.now_playing_title),
      now_playing_artist: asNullable(body.now_playing_artist),
      spotify_embed_url: spotifyEmbedUrl,
      quote_of_day: asNullable(body.quote_of_day),
      latest_article_url: asNullable(body.latest_article_url),
      editorial_feed_url: editorialFeedUrl,
      section_order: sectionOrder,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    if (error.message.includes("section_order") || error.message.includes("editorial_feed_url")) {
      return NextResponse.json(
        {
          error:
            "Colonne manquante dans Supabase (section_order/editorial_feed_url). Exécute les migrations SQL dans supabase/migrations."
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
