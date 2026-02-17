export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { fetchSpotifyTitleArtist } from "@/lib/spotify";
import { getPublicImageUrl } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type MoodboardPayload = {
  quotes: Array<{ quote: string; createdAt: string }>;
  songs: Array<{ songKey: string; title: string | null; artist: string | null; createdAt: string }>;
  images: Array<{ imageId: string; imageUrl: string | null; createdAt: string }>;
};

type SongKeyPayload = {
  title?: string;
  artist?: string;
  spotify?: string;
};

type SongLikeRow = {
  song_key: string;
  created_at: string;
  song_title?: string | null;
  song_artist?: string | null;
};

function migrationHint(message: string): string {
  if (message.includes("relation \"quote_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/005_quote_likes_and_shares.sql";
  }

  if (message.includes("relation \"song_likes\"") || message.includes("relation \"image_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/006_song_and_image_likes.sql";
  }

  return message;
}

function parseSongKey(songKey: string): { title: string | null; artist: string | null; spotify: string | null } {
  const normalized = songKey.trim();

  if (!normalized) {
    return { title: null, artist: null, spotify: null };
  }

  if (normalized.startsWith("{")) {
    try {
      const parsed = JSON.parse(normalized) as SongKeyPayload;
      return {
        title: parsed.title?.trim() || null,
        artist: parsed.artist?.trim() || null,
        spotify: parsed.spotify?.trim() || null
      };
    } catch {
      return { title: null, artist: null, spotify: null };
    }
  }

  if (normalized.includes("|")) {
    const [title, artist] = normalized.split("|");
    return {
      title: title?.trim() || null,
      artist: artist?.trim() || null,
      spotify: null
    };
  }

  if (normalized.includes("spotify.com") || normalized.startsWith("spotify:")) {
    return { title: null, artist: null, spotify: normalized };
  }

  return { title: null, artist: null, spotify: null };
}

async function loadSongLikes(
  fingerprint: string
): Promise<{ data: SongLikeRow[] | null; error: { message: string } | null }> {
  const supabase = getSupabaseServerClient();

  const withMeta = await supabase
    .from("song_likes")
    .select("song_key, song_title, song_artist, created_at")
    .eq("fingerprint", fingerprint)
    .order("created_at", { ascending: false });

  if (!withMeta.error) {
    return { data: withMeta.data as SongLikeRow[] | null, error: null };
  }

  if (withMeta.error.message.includes("song_title") || withMeta.error.message.includes("song_artist")) {
    const legacy = await supabase
      .from("song_likes")
      .select("song_key, created_at")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false });

    return {
      data: (legacy.data as SongLikeRow[] | null) ?? null,
      error: legacy.error ? { message: legacy.error.message } : null
    };
  }

  return { data: null, error: { message: withMeta.error.message } };
}

export async function GET(request: NextRequest) {
  try {
    const fingerprint = request.headers.get("x-fingerprint")?.trim() ?? "";

    if (!fingerprint) {
      const empty: MoodboardPayload = { quotes: [], songs: [], images: [] };
      return NextResponse.json(empty);
    }

    const supabase = getSupabaseServerClient();

    const [quoteLikes, songLikes, imageLikes] = await Promise.all([
      supabase
        .from("quote_likes")
        .select("quote_text, created_at")
        .eq("fingerprint", fingerprint)
        .order("created_at", { ascending: false }),
      loadSongLikes(fingerprint),
      supabase
        .from("image_likes")
        .select("image_id, created_at")
        .eq("fingerprint", fingerprint)
        .order("created_at", { ascending: false })
    ]);

    if (quoteLikes.error) {
      throw new Error(`Failed to load quote likes: ${quoteLikes.error.message}`);
    }

    if (songLikes.error) {
      throw new Error(`Failed to load song likes: ${songLikes.error.message}`);
    }

    if (imageLikes.error) {
      throw new Error(`Failed to load image likes: ${imageLikes.error.message}`);
    }

    const imageIds = (imageLikes.data ?? []).map((item) => item.image_id).filter(Boolean);

    let imageMap = new Map<string, string | null>();
    if (imageIds.length) {
      const carouselRows = await supabase
        .from("carousel_images")
        .select("id, storage_path")
        .in("id", imageIds);

      if (!carouselRows.error) {
        imageMap = new Map(
          (carouselRows.data ?? []).map((row) => [row.id, row.storage_path ? getPublicImageUrl(row.storage_path) : null])
        );
      }
    }

    const spotifyMetaCache = new Map<string, Promise<{ title: string | null; artist: string | null }>>();

    const songs = await Promise.all(
      (songLikes.data ?? []).map(async (item) => {
        const parsed = parseSongKey(item.song_key);

        let spotifyMeta = { title: null as string | null, artist: null as string | null };
        if (parsed.spotify) {
          if (!spotifyMetaCache.has(parsed.spotify)) {
            spotifyMetaCache.set(parsed.spotify, fetchSpotifyTitleArtist(parsed.spotify));
          }
          spotifyMeta = await spotifyMetaCache.get(parsed.spotify)!;
        }

        return {
          songKey: item.song_key,
          title: spotifyMeta.title ?? item.song_title?.trim() ?? parsed.title,
          artist: spotifyMeta.artist ?? item.song_artist?.trim() ?? parsed.artist,
          createdAt: item.created_at
        };
      })
    );

    const payload: MoodboardPayload = {
      quotes: (quoteLikes.data ?? []).map((item) => ({
        quote: item.quote_text,
        createdAt: item.created_at
      })),
      songs,
      images: (imageLikes.data ?? []).map((item) => ({
        imageId: item.image_id,
        imageUrl: imageMap.get(item.image_id) ?? null,
        createdAt: item.created_at
      }))
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
