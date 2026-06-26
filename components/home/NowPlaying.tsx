"use client";

import { Heart, Music2, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const currentArtworkUrl = currentTrack.artworkUrl;
  const currentPreviewUrl = currentTrack.previewUrl;

  const appleMusicEmbedUrl = useMemo(() => toAppleMusicEmbedUrl(currentAppleMusicUrl), [currentAppleMusicUrl]);
  const appleMusicLink = useMemo(() => currentAppleMusicUrl?.trim() ?? "", [currentAppleMusicUrl]);
  const audioPreviewUrl = useMemo(() => currentPreviewUrl?.trim() ?? "", [currentPreviewUrl]);

  const songKey = useMemo(
    () => buildSongKey(currentTitle, currentArtist, currentSpotifyEmbedUrl, appleMusicLink || appleMusicEmbedUrl),
    [currentTitle, currentArtist, currentSpotifyEmbedUrl, appleMusicLink, appleMusicEmbedUrl]
  );

  const [fingerprint, setFingerprint] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (!audioPreviewUrl || !audioRef.current) {
      setIsPreviewPlaying(false);
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPreviewPlaying(false);
  }, [audioPreviewUrl, songKey]);

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

  async function onTogglePreview() {
    if (!audioRef.current || !audioPreviewUrl) return;

    if (isPreviewPlaying) {
      audioRef.current.pause();
      setIsPreviewPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPreviewPlaying(true);
    } catch {
      setIsPreviewPlaying(false);
    }
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
      ) : appleMusicLink ? (
        <div className="mt-3 rounded-2xl border border-borderSubtle/70 bg-gradient-to-br from-[#171828] via-[#181A2C] to-[#11111D] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1a1a24]">
              {currentArtworkUrl ? (
                <img src={currentArtworkUrl} alt={currentTitle ? `Cover ${currentTitle}` : "Cover art"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-textMuted"><Music2 className="h-6 w-6" /></div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-textPrimary">{currentTitle ?? "Morceau en cours"}</p>
              <p className="truncate text-sm text-textSecondary">{currentArtist ?? "Artiste inconnu"}</p>

              {audioPreviewUrl ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTogglePreview}
                    className="inline-flex items-center gap-1.5 rounded-full border border-lavender/45 bg-lavender/20 px-3 py-1.5 text-xs font-medium text-lavender transition-all duration-300 ease-calm hover:border-lavender/70 hover:bg-lavender/30"
                    aria-label={isPreviewPlaying ? "Mettre en pause l'extrait" : "Lire l'extrait"}
                  >
                    {isPreviewPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPreviewPlaying ? "Pause" : "Écouter"}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {audioPreviewUrl ? (
            <audio
              ref={audioRef}
              src={audioPreviewUrl}
              preload="none"
              onPause={() => setIsPreviewPlaying(false)}
              onEnded={() => setIsPreviewPlaying(false)}
              className="hidden"
            />
          ) : null}
        </div>
      ) : currentTitle || currentArtist ? (
        <p className="mt-3 text-sm text-textSecondary">Morceau détecté, mais aucun lecteur Apple Music/Spotify disponible.</p>
      ) : (
        <p className="mt-3 text-sm text-textSecondary">Aucun morceau détecté pour le moment.</p>
      )}
    </section>
  );
}
