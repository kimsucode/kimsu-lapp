import { NextResponse } from "next/server";

import { getAutoNowPlayingFromLastFm } from "@/lib/auto-now-playing";
import { getAppSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [settings, autoNowPlaying] = await Promise.all([
    getAppSettings(),
    getAutoNowPlayingFromLastFm()
  ]);

  return NextResponse.json(
    {
      title: autoNowPlaying?.title ?? settings?.now_playing_title ?? null,
      artist: autoNowPlaying?.artist ?? settings?.now_playing_artist ?? null,
      spotifyEmbedUrl: autoNowPlaying?.spotifyEmbedUrl ?? settings?.spotify_embed_url ?? null,
      appleMusicUrl: autoNowPlaying?.appleMusicUrl ?? null,
      artworkUrl: autoNowPlaying?.artworkUrl ?? null,
      previewUrl: autoNowPlaying?.previewUrl ?? null
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
