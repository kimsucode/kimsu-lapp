"use client";

import { Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getOrCreateFingerprint } from "@/lib/client/fingerprint";

type Props = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
  appleMusicUrl?: string | null;
  artworkUrl?: string | null;
  previewUrl?: string | null;
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

type CurrentNowPlayingPayload = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
  appleMusicUrl: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
};

type NowPlayingState = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
  appleMusicUrl: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
};

function asTrimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizeTrack(input: Partial<NowPlayingState>): NowPlayingState {
  return {
    title: asTrimmedOrNull(input.title),
    artist: asTrimmedOrNull(input.artist),
    spotifyEmbedUrl: asTrimmedOrNull(input.spotifyEmbedUrl),
    appleMusicUrl: asTrimmedOrNull(input.appleMusicUrl),
    artworkUrl: asTrimmedOrNull(input.artworkUrl),
    previewUrl: asTrimmedOrNull(input.previewUrl)
  };
}

function areTracksEqual(a: NowPlayingState, b: NowPlayingState): boolean {
  return (
    a.title === b.title &&
    a.artist === b.artist &&
    a.spotifyEmbedUrl === b.spotifyEmbedUrl &&
    a.appleMusicUrl === b.appleMusicUrl &&
    a.artworkUrl === b.artworkUrl &&
    a.previewUrl === b.previewUrl
  );
}

function buildSongKey(
  title: string | null,
  artist: string | null,
  spotifyEmbedUrl: string | null,
  appleMusicRef: string | null
): string {
  const payload: SongKeyPayload = {
    title: title?.trim() ?? "",
    artist: artist?.trim() ?? "",
    spotify: spotifyEmbedUrl?.trim() ?? "",
    appleMusic: appleMusicRef?.trim() ?? ""
  };

  if (!payload.title && !payload.artist && !payload.spotify && !payload.appleMusic) {
    return "";
  }

  return JSON.stringify(payload);
}

export function NowPlaying({ title, artist, spotifyEmbedUrl, appleMusicUrl, artworkUrl, previewUrl }: Props) {
  const [currentTrack, setCurrentTrack] = useState<NowPlayingState>(() =>
    normalizeTrack({
      title,
      artist,
      spotifyEmbedUrl,
      appleMusicUrl,
      artworkUrl,
      previewUrl
    })
  );

  useEffect(() => {
    const fromProps = normalizeTrack({
      title,
      artist,
      spotifyEmbedUrl,
      appleMusicUrl,
      artworkUrl,
      previewUrl
    });

    setCurrentTrack((prev) => (areTracksEqual(prev, fromProps) ? prev : fromProps));
  }, [title, artist, spotifyEmbedUrl, appleMusicUrl, artworkUrl, previewUrl]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refreshNowPlaying() {
      if (inFlight) return;
      inFlight = true;

      try {
        const response = await fetch("/api/now-playing/current", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as CurrentNowPlayingPayload;
        if (cancelled) return;

        const nextTrack = normalizeTrack(payload);
        setCurrentTrack((prev) => {
          const shouldKeepSpotify =
            prev.spotifyEmbedUrl &&
            !nextTrack.spotifyEmbedUrl &&
            prev.title === nextTrack.title &&
            prev.artist === nextTrack.artist;

          const mergedTrack = shouldKeepSpotify
            ? { ...nextTrack, spotifyEmbedUrl: prev.spotifyEmbedUrl }
            : nextTrack;

          return areTracksEqual(prev, mergedTrack) ? prev : mergedTrack;
        });
      } catch {
        // Keep last known track if refresh fails.
      } finally {
        inFlight = false;
      }
    }

    void refreshNowPlaying();
    const intervalId = window.setInterval(() => {
      void refreshNowPlaying();
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const currentTitle = currentTrack.title;
  const currentArtist = currentTrack.artist;
  const currentSpotifyEmbedUrl = currentTrack.spotifyEmbedUrl;
  const currentAppleMusicUrl = currentTrack.appleMusicUrl;
  const appleMusicLink = useMemo(() => currentAppleMusicUrl?.trim() ?? "", [currentAppleMusicUrl]);

  const songKey = useMemo(
    () => buildSongKey(currentTitle, currentArtist, currentSpotifyEmbedUrl, appleMusicLink),
    [currentTitle, currentArtist, currentSpotifyEmbedUrl, appleMusicLink]
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
        title: currentTitle,
        artist: currentArtist
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

      {currentSpotifyEmbedUrl ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-borderSubtle/70">
          <iframe
            title="Spotify player"
            src={currentSpotifyEmbedUrl}
            width="100%"
            height="152"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block border-0"
          />
        </div>
      ) : currentTitle || currentArtist ? (
        <p className="mt-3 text-sm text-textSecondary">Morceau détecté, mais aucun lecteur Apple Music/Spotify disponible.</p>
      ) : (
        <p className="mt-3 text-sm text-textSecondary">Aucun morceau détecté pour le moment.</p>
      )}
    </section>
  );
}
