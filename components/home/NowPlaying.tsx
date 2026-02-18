"use client";

import { Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getOrCreateFingerprint } from "@/lib/client/fingerprint";

type Props = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
  appleMusicUrl?: string | null;
};

type LikesPayload = {
  count: number;
  likedByMe: boolean;
};

type SongKeyPayload = {
  title: string;
  artist: string;
  spotify: string;
  appleMusic: string;
};

function toAppleMusicEmbedUrl(input: string | null | undefined): string | null {
  const raw = input?.trim() ?? "";
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.hostname.includes("itunes.apple.com")) {
      url.hostname = "music.apple.com";
    }

    if (!url.hostname.includes("music.apple.com") && !url.hostname.includes("embed.music.apple.com")) {
      return null;
    }

    const embed = new URL(url.toString());
    embed.hostname = "embed.music.apple.com";

    if (!embed.searchParams.has("app")) {
      embed.searchParams.set("app", "music");
    }

    return embed.toString();
  } catch {
    return null;
  }
}

function buildSongKey(
  title: string | null,
  artist: string | null,
  spotifyEmbedUrl: string | null,
  appleMusicEmbedUrl: string | null
): string {
  const payload: SongKeyPayload = {
    title: title?.trim() ?? "",
    artist: artist?.trim() ?? "",
    spotify: spotifyEmbedUrl?.trim() ?? "",
    appleMusic: appleMusicEmbedUrl?.trim() ?? ""
  };

  if (!payload.title && !payload.artist && !payload.spotify && !payload.appleMusic) {
    return "";
  }

  return JSON.stringify(payload);
}

export function NowPlaying({ title, artist, spotifyEmbedUrl, appleMusicUrl }: Props) {
  const appleMusicEmbedUrl = useMemo(() => toAppleMusicEmbedUrl(appleMusicUrl), [appleMusicUrl]);
  const songKey = useMemo(
    () => buildSongKey(title, artist, spotifyEmbedUrl, appleMusicEmbedUrl),
    [title, artist, spotifyEmbedUrl, appleMusicEmbedUrl]
  );

  const [fingerprint, setFingerprint] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  useEffect(() => {
    setFingerprint(getOrCreateFingerprint());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLikes() {
      if (!songKey) {
        setLoadingLikes(false);
        return;
      }

      setLoadingLikes(true);
      const response = await fetch(`/api/now-playing/likes?songKey=${encodeURIComponent(songKey)}`, {
        headers: fingerprint ? { "x-fingerprint": fingerprint } : undefined
      }).catch(() => null);

      if (!response || !response.ok) {
        if (!cancelled) setLoadingLikes(false);
        return;
      }

      const payload = (await response.json()) as LikesPayload;
      if (!cancelled) {
        setLikesCount(payload.count);
        setLikedByMe(payload.likedByMe);
        setLoadingLikes(false);
      }
    }

    void loadLikes();

    return () => {
      cancelled = true;
    };
  }, [songKey, fingerprint]);

  async function onToggleLike() {
    if (!songKey || !fingerprint || isTogglingLike || loadingLikes) return;

    setIsTogglingLike(true);

    const prevLiked = likedByMe;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLikedByMe(nextLiked);
    setLikesCount(nextCount);

    const response = await fetch("/api/now-playing/likes/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fingerprint": fingerprint
      },
      body: JSON.stringify({
        songKey,
        title,
        artist
      })
    }).catch(() => null);

    if (!response || !response.ok) {
      setLikedByMe(prevLiked);
      setLikesCount(prevCount);
      setIsTogglingLike(false);
      return;
    }

    const payload = (await response.json()) as LikesPayload;
    setLikedByMe(payload.likedByMe);
    setLikesCount(payload.count);
    setIsTogglingLike(false);
  }

  return (
    <section
      className="animate-fadeCalm rounded-soft border border-borderSubtle bg-surface px-4 py-4 shadow-soft transition-all duration-300 ease-calm"
      style={{ animationDelay: "40ms" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.15em] text-textMuted">Now playing</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLike}
            disabled={!songKey || loadingLikes || isTogglingLike}
            className={likedByMe
              ? "inline-flex items-center gap-1.5 rounded-full border border-lavender/45 bg-lavender/20 px-2.5 py-1 text-xs text-lavender transition-all duration-300 ease-calm"
              : "inline-flex items-center gap-1.5 rounded-full border border-borderSubtle bg-[#191922] px-2.5 py-1 text-xs text-textSecondary transition-all duration-300 ease-calm hover:border-lavender/35 hover:text-lavender"
            }
            aria-label={likedByMe ? "Retirer le like du morceau" : "Liker le morceau"}
          >
            <Heart className={`h-3.5 w-3.5 ${likedByMe ? "fill-current" : ""}`} />
            <span>Like</span>
            {likesCount > 0 ? <span className="ml-0.5 text-[11px] font-semibold">{likesCount}</span> : null}
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-rose/35 bg-rose/12 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFDDE7]">Live</span>
          </div>
        </div>
      </div>

      {appleMusicEmbedUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-borderSubtle/70 bg-black/20 p-1">
          <iframe
            title="Apple Music player"
            src={appleMusicEmbedUrl}
            width="100%"
            height="175"
            loading="lazy"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            className="block border-0"
          />
        </div>
      ) : spotifyEmbedUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-borderSubtle/70">
          <iframe
            title="Spotify player"
            src={spotifyEmbedUrl}
            width="100%"
            height="152"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block border-0"
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-textSecondary">Morceau détecté, mais aucun lecteur Apple Music/Spotify disponible.</p>
      )}
    </section>
  );
}
