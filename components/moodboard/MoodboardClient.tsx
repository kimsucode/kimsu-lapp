"use client";

import { useEffect, useMemo, useState } from "react";

import { getOrCreateFingerprint } from "@/lib/client/fingerprint";

type MoodboardPayload = {
  quotes: Array<{ quote: string; createdAt: string }>;
  songs: Array<{ songKey: string; title: string | null; artist: string | null; createdAt: string }>;
  images: Array<{ imageId: string; imageUrl: string | null; createdAt: string }>;
};

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function songLabel(item: MoodboardPayload["songs"][number]): string {
  if (item.title && item.artist) {
    return `${item.title} · ${item.artist}`;
  }

  if (item.title) {
    return item.title;
  }

  if (item.artist) {
    return item.artist;
  }

  return "Morceau aimé";
}

export function MoodboardClient() {
  const [fingerprint, setFingerprint] = useState("");
  const [data, setData] = useState<MoodboardPayload>({ quotes: [], songs: [], images: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFingerprint(getOrCreateFingerprint());
  }, []);

  useEffect(() => {
    if (!fingerprint) return;

    let cancelled = false;

    async function loadMoodboard() {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/moodboard", {
        headers: { "x-fingerprint": fingerprint }
      }).catch(() => null);

      if (!response || !response.ok) {
        if (!cancelled) {
          setError("Impossible de charger ton moodboard.");
          setLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as MoodboardPayload;
      if (!cancelled) {
        setData(payload);
        setLoading(false);
      }
    }

    void loadMoodboard();

    return () => {
      cancelled = true;
    };
  }, [fingerprint]);

  const totalLikes = useMemo(
    () => data.quotes.length + data.songs.length + data.images.length,
    [data.images.length, data.quotes.length, data.songs.length]
  );

  if (loading) {
    return <p className="text-sm text-textSecondary">Chargement de ton moodboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-textSecondary">{error}</p>;
  }

  if (!totalLikes) {
    return <p className="text-sm text-textSecondary">Aucun like pour l&apos;instant. Like un morceau, une image ou une phrase pour commencer ton moodboard.</p>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-textMuted">Phrases sauvegardées</p>
        {data.quotes.length ? (
          <div className="mt-3 space-y-3">
            {data.quotes.map((item, index) => (
              <article key={`${item.createdAt}-${index}`} className="rounded-xl border border-borderSubtle/70 bg-[#171720] p-3">
                <p className="text-sm italic leading-7 text-[#EEEAF9]">{item.quote}</p>
                <p className="mt-2 text-xs text-textMuted">{formatDateLabel(item.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-textSecondary">Aucune phrase aimée.</p>
        )}
      </section>

      <section className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-textMuted">Chansons aimées</p>
        {data.songs.length ? (
          <ul className="mt-3 space-y-2">
            {data.songs.map((item, index) => (
              <li key={`${item.createdAt}-${index}`} className="rounded-xl border border-borderSubtle/70 bg-[#171720] p-3">
                <p className="text-sm text-textPrimary">{songLabel(item)}</p>
                <p className="mt-1 text-xs text-textMuted">{formatDateLabel(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-textSecondary">Aucune chanson aimée.</p>
        )}
      </section>

      <section className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-textMuted">Images aimées</p>
        {data.images.length ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {data.images.map((item) => (
              <figure key={`${item.imageId}-${item.createdAt}`} className="overflow-hidden rounded-xl border border-borderSubtle/70 bg-[#171720] p-1.5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="Image aimée" className="h-28 w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-lg bg-[#1d1d27] text-xs text-textMuted">Image indisponible</div>
                )}
                <figcaption className="mt-1 px-1 text-[11px] text-textMuted">{formatDateLabel(item.createdAt)}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-textSecondary">Aucune image aimée.</p>
        )}
      </section>
    </div>
  );
}
