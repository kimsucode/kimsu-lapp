import "server-only";

type AutoNowPlaying = {
  title: string | null;
  artist: string | null;
  appleMusicUrl: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
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
    artworkUrl100?: string;
    previewUrl?: string;
  }>;
};

type AppleMatch = {
  url: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
};

function asNonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(feat|featuring|ft|remaster(?:ed)?|live|version|edit|mix)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toTokenSet(value: string): Set<string> {
  return new Set(
    normalizeForMatch(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
  );
}

function tokenCoverage(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;

  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }

  return shared / Math.max(a.size, b.size);
}

function similarityScore(expected: string, candidate: string): number {
  const a = normalizeForMatch(expected);
  const b = normalizeForMatch(candidate);

  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;

  return tokenCoverage(toTokenSet(a), toTokenSet(b));
}

function toHiResArtwork(url: string | null): string | null {
  if (!url) return null;

  return url.replace(/\/[0-9]+x[0-9]+bb\./, "/600x600bb.");
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

async function findAppleMusicMatch(title: string, artist: string): Promise<AppleMatch> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=15`;
  const payload = await fetchJsonWithTimeout<ITunesPayload>(url, 3500);
  if (!payload?.results?.length) {
    return { url: null, artworkUrl: null, previewUrl: null };
  }

  let bestUrl: string | null = null;
  let bestArtwork: string | null = null;
  let bestPreviewUrl: string | null = null;
  let bestScore = 0;

  let fallbackUrl: string | null = null;
  let fallbackArtwork: string | null = null;
  let fallbackPreviewUrl: string | null = null;

  for (const item of payload.results) {
    const trackName = asNonEmpty(item.trackName);
    const artistName = asNonEmpty(item.artistName);
    const trackUrl = asNonEmpty(item.trackViewUrl);
    const artworkUrl = toHiResArtwork(asNonEmpty(item.artworkUrl100));
    const previewUrl = asNonEmpty(item.previewUrl);

    if (!trackName || !artistName || !trackUrl) continue;

    if (!fallbackUrl) fallbackUrl = trackUrl;
    if (!fallbackArtwork) fallbackArtwork = artworkUrl;
    if (!fallbackPreviewUrl) fallbackPreviewUrl = previewUrl;

    const titleScore = similarityScore(title, trackName);
    const artistScore = similarityScore(artist, artistName);
    const score = titleScore * 0.65 + artistScore * 0.35;

    if (score > bestScore) {
      bestScore = score;
      bestUrl = trackUrl;
      bestArtwork = artworkUrl;
      bestPreviewUrl = previewUrl;
    }
  }

  if (bestUrl && bestScore >= 0.72) {
    return { url: bestUrl, artworkUrl: bestArtwork, previewUrl: bestPreviewUrl };
  }

  if (bestUrl && bestScore >= 0.56) {
    return { url: bestUrl, artworkUrl: bestArtwork, previewUrl: bestPreviewUrl };
  }

  return { url: fallbackUrl, artworkUrl: fallbackArtwork, previewUrl: fallbackPreviewUrl };
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

  const appleMatch = await findAppleMusicMatch(title, artist);

  return {
    title,
    artist,
    appleMusicUrl: appleMatch.url,
    artworkUrl: appleMatch.artworkUrl,
    previewUrl: appleMatch.previewUrl,
    spotifyEmbedUrl: null
  };
}
