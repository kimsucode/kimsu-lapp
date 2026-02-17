import "server-only";

import { fetchSpotifyTitleArtist } from "@/lib/spotify";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type LikeResult = {
  count: number;
  likedByMe: boolean;
};

type SongLikeMeta = {
  title?: string | null;
  artist?: string | null;
};

type SongKeyPayload = {
  title?: string;
  artist?: string;
  spotify?: string;
};

function parseSongKey(songKey: string): { title: string | null; artist: string | null; spotify: string | null } {
  const normalized = songKey.trim();
  if (!normalized) return { title: null, artist: null, spotify: null };

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

  if (normalized.includes("spotify.com") || normalized.startsWith("spotify:")) {
    return { title: null, artist: null, spotify: normalized };
  }

  if (normalized.includes("|")) {
    const [title, artist] = normalized.split("|");
    return {
      title: title?.trim() || null,
      artist: artist?.trim() || null,
      spotify: null
    };
  }

  return { title: null, artist: null, spotify: null };
}

async function getLikeResult(
  table: "song_likes" | "image_likes",
  column: "song_key" | "image_id",
  value: string,
  fingerprint?: string
): Promise<LikeResult> {
  const normalizedValue = value.trim();
  const normalizedFingerprint = fingerprint?.trim() ?? "";

  if (!normalizedValue) {
    throw new Error("Like key is required");
  }

  const supabase = getSupabaseServerClient();

  const countResult = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, normalizedValue);

  if (countResult.error) {
    throw new Error(`Failed to load likes: ${countResult.error.message}`);
  }

  if (!normalizedFingerprint) {
    return { count: countResult.count ?? 0, likedByMe: false };
  }

  const likedResult = await supabase
    .from(table)
    .select("id")
    .eq(column, normalizedValue)
    .eq("fingerprint", normalizedFingerprint)
    .maybeSingle();

  if (likedResult.error) {
    throw new Error(`Failed to check like: ${likedResult.error.message}`);
  }

  return {
    count: countResult.count ?? 0,
    likedByMe: Boolean(likedResult.data?.id)
  };
}

async function toggleLike(
  table: "song_likes" | "image_likes",
  column: "song_key" | "image_id",
  value: string,
  fingerprint: string
): Promise<LikeResult> {
  const normalizedValue = value.trim();
  const normalizedFingerprint = fingerprint.trim();

  if (!normalizedValue) {
    throw new Error("Like key is required");
  }

  if (!normalizedFingerprint) {
    throw new Error("Fingerprint is required");
  }

  const supabase = getSupabaseServerClient();

  const existing = await supabase
    .from(table)
    .select("id")
    .eq(column, normalizedValue)
    .eq("fingerprint", normalizedFingerprint)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to toggle like: ${existing.error.message}`);
  }

  if (existing.data?.id) {
    const remove = await supabase.from(table).delete().eq("id", existing.data.id);
    if (remove.error) {
      throw new Error(`Failed to remove like: ${remove.error.message}`);
    }
  } else {
    const insert = await supabase.from(table).insert({
      [column]: normalizedValue,
      fingerprint: normalizedFingerprint
    });

    if (insert.error) {
      throw new Error(`Failed to save like: ${insert.error.message}`);
    }
  }

  return getLikeResult(table, column, normalizedValue, normalizedFingerprint);
}

export function getSongLikes(songKey: string, fingerprint?: string): Promise<LikeResult> {
  return getLikeResult("song_likes", "song_key", songKey, fingerprint);
}

export async function toggleSongLike(songKey: string, fingerprint: string, meta?: SongLikeMeta): Promise<LikeResult> {
  const normalizedValue = songKey.trim();
  const normalizedFingerprint = fingerprint.trim();

  if (!normalizedValue) {
    throw new Error("Like key is required");
  }

  if (!normalizedFingerprint) {
    throw new Error("Fingerprint is required");
  }

  const supabase = getSupabaseServerClient();

  const existing = await supabase
    .from("song_likes")
    .select("id")
    .eq("song_key", normalizedValue)
    .eq("fingerprint", normalizedFingerprint)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to toggle like: ${existing.error.message}`);
  }

  if (existing.data?.id) {
    const remove = await supabase.from("song_likes").delete().eq("id", existing.data.id);
    if (remove.error) {
      throw new Error(`Failed to remove like: ${remove.error.message}`);
    }
  } else {
    const parsed = parseSongKey(normalizedValue);
    const spotifyMeta = await fetchSpotifyTitleArtist(parsed.spotify);

    const payload = {
      song_key: normalizedValue,
      fingerprint: normalizedFingerprint,
      song_title: spotifyMeta.title ?? meta?.title?.trim() ?? parsed.title,
      song_artist: spotifyMeta.artist ?? meta?.artist?.trim() ?? parsed.artist
    };

    const insert = await supabase.from("song_likes").insert(payload);

    if (insert.error) {
      if (insert.error.message.includes("song_title") || insert.error.message.includes("song_artist")) {
        const fallbackInsert = await supabase.from("song_likes").insert({
          song_key: normalizedValue,
          fingerprint: normalizedFingerprint
        });

        if (fallbackInsert.error) {
          throw new Error(`Failed to save like: ${fallbackInsert.error.message}`);
        }
      } else {
        throw new Error(`Failed to save like: ${insert.error.message}`);
      }
    }
  }

  return getLikeResult("song_likes", "song_key", normalizedValue, normalizedFingerprint);
}

export function getImageLikes(imageId: string, fingerprint?: string): Promise<LikeResult> {
  return getLikeResult("image_likes", "image_id", imageId, fingerprint);
}

export function toggleImageLike(imageId: string, fingerprint: string): Promise<LikeResult> {
  return toggleLike("image_likes", "image_id", imageId, fingerprint);
}
