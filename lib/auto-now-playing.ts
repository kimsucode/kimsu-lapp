import "server-only";

import { resolveAppleMusicToSpotifyEmbedUrl } from "@/lib/spotify";

type AutoNowPlaying = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
};

type LastFmTrack = {
  name?: string;
  artist?: { "#text"?: string };
  ["@attr"]?: { nowplaying?: string };
};

type LastFmPayload = {
  recenttracks?: {
    track?: LastFmTrack[] | LastFmTrack;
  };
};

type ITunesPayload = {
  results?: Array<{
    trackViewUrl?: string;
    artistName?: string;
    trackName?: string;
  }>;
};

function asNonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 4500): Promise<T | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function getLatestTrack(payload: LastFmPayload): LastFmTrack | null {
  const raw = payload.recenttracks?.track;
  if (!raw) return null;

  const tracks = Array.isArray(raw) ? raw : [raw];
  if (!tracks.length) return null;

  const current = tracks.find((track) => track?.["@attr"]?.nowplaying === "true");
  return current ?? tracks[0] ?? null;
}

async function findAppleMusicUrl(title: string, artist: string): Promise<string | null> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
  const payload = await fetchJsonWithTimeout<ITunesPayload>(url, 3500);
  if (!payload?.results?.length) return null;

  const normalizedArtist = artist.toLowerCase();
  const candidate = payload.results.find((item) =>
    (item.artistName ?? "").toLowerCase().includes(normalizedArtist)
  ) ?? payload.results[0];

  return asNonEmpty(candidate?.trackViewUrl);
}

export async function getAutoNowPlayingFromLastFm(): Promise<AutoNowPlaying | null> {
  const apiKey = asNonEmpty(process.env.LASTFM_API_KEY);
  const username = asNonEmpty(process.env.LASTFM_USERNAME);

  if (!apiKey || !username) {
    return null;
  }

  const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${encodeURIComponent(apiKey)}&format=json&limit=1`;

  const payload = await fetchJsonWithTimeout<LastFmPayload>(lastFmUrl);
  if (!payload) return null;

  const track = getLatestTrack(payload);
  const title = asNonEmpty(track?.name);
  const artist = asNonEmpty(track?.artist?.["#text"]);

  if (!title || !artist) return null;

  const appleMusicUrl = await findAppleMusicUrl(title, artist);
  const spotifyEmbedUrl = appleMusicUrl
    ? await resolveAppleMusicToSpotifyEmbedUrl(appleMusicUrl)
    : null;

  return {
    title,
    artist,
    spotifyEmbedUrl
  };
}
