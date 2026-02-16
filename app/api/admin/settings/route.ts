import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { normalizeHomeSectionOrder } from "@/lib/sections";
import { toSpotifyEmbedUrl } from "@/lib/spotify";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type SettingsPayload = {
  now_playing_title?: string;
  now_playing_artist?: string;
  spotify_embed_url?: string;
  quote_of_day?: string;
  latest_article_url?: string;
  section_order?: unknown;
};

function asNullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SettingsPayload;

  const rawSpotify = asNullable(body.spotify_embed_url);
  const spotifyEmbedUrl = rawSpotify ? toSpotifyEmbedUrl(rawSpotify) : null;

  if (rawSpotify && !spotifyEmbedUrl) {
    return NextResponse.json(
      { error: "Lien Spotify invalide. Utilise un lien track/album/playlist Spotify." },
      { status: 400 }
    );
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
      section_order: sectionOrder,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    if (error.message.includes("section_order")) {
      return NextResponse.json(
        {
          error:
            "Colonne section_order absente dans Supabase. Exécute la migration SQL pour activer l'ordre des sections."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}
