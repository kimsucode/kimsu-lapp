"use client";

import { FormEvent, useState } from "react";

import { DEFAULT_HOME_SECTION_ORDER } from "@/lib/sections";
import type { HomeSectionKey } from "@/types/content";

type Props = {
  initialValues: {
    now_playing_title: string;
    now_playing_artist: string;
    spotify_embed_url: string;
    quote_of_day: string;
    latest_article_url: string;
    editorial_feed_url: string;
    section_order: HomeSectionKey[];
  };
};

const sectionLabels: Record<HomeSectionKey, string> = {
  now_playing: "Now Playing",
  carousel: "Carousel images",
  quote: "Phrase du jour",
  latest_article: "Dernier article"
};

function moveItem(order: HomeSectionKey[], index: number, direction: -1 | 1): HomeSectionKey[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= order.length) {
    return order;
  }

  const copy = [...order];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

export function AdminSettingsForm({ initialValues }: Props) {
  const [values, setValues] = useState({
    ...initialValues,
    section_order:
      initialValues.section_order.length === DEFAULT_HOME_SECTION_ORDER.length
        ? initialValues.section_order
        : DEFAULT_HOME_SECTION_ORDER
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error || "Erreur de sauvegarde.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setMessage("Contenu mis à jour.");
  }

  return (
    <section className="card">
      <h2 className="section-title">Contenu Home</h2>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="song-title">Titre du morceau</label>
          <input
            id="song-title"
            value={values.now_playing_title}
            onChange={(event) => setValues((v) => ({ ...v, now_playing_title: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="song-artist">Artiste</label>
          <input
            id="song-artist"
            value={values.now_playing_artist}
            onChange={(event) => setValues((v) => ({ ...v, now_playing_artist: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="spotify">Lien Spotify</label>
          <input
            id="spotify"
            placeholder="https://open.spotify.com/track/..."
            value={values.spotify_embed_url}
            onChange={(event) => setValues((v) => ({ ...v, spotify_embed_url: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="quote">Phrase du jour</label>
          <textarea
            id="quote"
            rows={4}
            value={values.quote_of_day}
            onChange={(event) => setValues((v) => ({ ...v, quote_of_day: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="article">URL dernier article (fallback manuel)</label>
          <input
            id="article"
            type="url"
            placeholder="https://..."
            value={values.latest_article_url}
            onChange={(event) => setValues((v) => ({ ...v, latest_article_url: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="feed">URL flux éditorial RSS/Atom (auto)</label>
          <input
            id="feed"
            type="url"
            placeholder="https://tonblog.com/feed.xml"
            value={values.editorial_feed_url}
            onChange={(event) => setValues((v) => ({ ...v, editorial_feed_url: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Ordre des sections (Home)</label>
          <div className="image-list">
            {values.section_order.map((section, index) => (
              <div className="image-row" key={section}>
                <span className="muted" style={{ flex: 1 }}>
                  {index + 1}. {sectionLabels[section]}
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setValues((v) => ({
                      ...v,
                      section_order: moveItem(v.section_order, index, -1)
                    }))
                  }
                  disabled={index === 0}
                >
                  Monter
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setValues((v) => ({
                      ...v,
                      section_order: moveItem(v.section_order, index, 1)
                    }))
                  }
                  disabled={index === values.section_order.length - 1}
                >
                  Descendre
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </button>

        {message ? <p className="muted">{message}</p> : null}
      </form>
    </section>
  );
}
