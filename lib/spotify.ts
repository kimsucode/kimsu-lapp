const ALLOWED_TYPES = new Set(["track", "album", "playlist", "episode", "show"]);

type ParsedSpotify = {
  embedUrl: string;
  canonicalUrl: string;
};

type SpotifyTitleArtist = {
  title: string | null;
  artist: string | null;
};

function cleanId(value: string): string {
  return value.trim().split(/[?&#]/)[0] ?? "";
}

function isLocaleSegment(value: string): boolean {
  return /^intl-[a-z]{2}$/i.test(value) || /^[a-z]{2}-[a-z]{2}$/i.test(value);
}

function splitTitleArtist(raw: string): SpotifyTitleArtist {
  const normalized = raw.trim();
  if (!normalized) return { title: null, artist: null };

  const separators = [" - ", " – ", " — "];
  for (const separator of separators) {
    const index = normalized.indexOf(separator);
    if (index > 0) {
      const title = normalized.slice(0, index).trim();
      const artist = normalized.slice(index + separator.length).trim();
      return {
        title: title || null,
        artist: artist || null
      };
    }
  }

  return { title: normalized, artist: null };
}

export function toSpotifyEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null;

  const raw = input.trim();
  if (!raw) return null;

  if (raw.startsWith("spotify:")) {
    const [, type, id] = raw.split(":");
    const cleanType = (type || "").trim().toLowerCase();
    const clean = cleanId(id || "");
    if (ALLOWED_TYPES.has(cleanType) && clean) {
      return `https://open.spotify.com/embed/${cleanType}/${clean}`;
    }
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (!url.hostname.includes("spotify.com")) {
    return null;
  }

  let parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  if (isLocaleSegment(parts[0])) {
    parts = parts.slice(1);
  }

  if (parts.length < 2) return null;

  const [first, second, third] = parts;

  if (first === "embed" && second && third) {
    const type = second.toLowerCase();
    const id = cleanId(third);
    if (ALLOWED_TYPES.has(type) && id) {
      return `https://open.spotify.com/embed/${type}/${id}`;
    }
    return null;
  }

  const type = first.toLowerCase();
  const id = cleanId(second || "");
  if (!ALLOWED_TYPES.has(type) || !id) return null;

  return `https://open.spotify.com/embed/${type}/${id}`;
}

export function parseSpotifyUrls(input: string | null | undefined): ParsedSpotify | null {
  const embedUrl = toSpotifyEmbedUrl(input);
  if (!embedUrl) return null;

  const parts = embedUrl.split("/");
  const type = parts[parts.length - 2];
  const id = parts[parts.length - 1];

  return {
    embedUrl,
    canonicalUrl: `https://open.spotify.com/${type}/${id}`
  };
}

export async function fetchSpotifyTitleArtist(input: string | null | undefined): Promise<SpotifyTitleArtist> {
  const parsed = parseSpotifyUrls(input);
  if (!parsed) {
    return { title: null, artist: null };
  }

  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "force-cache"
    });

    if (!response.ok) {
      return { title: null, artist: null };
    }

    const payload = (await response.json()) as { title?: string };
    return splitTitleArtist(payload.title ?? "");
  } catch {
    return { title: null, artist: null };
  }
}
