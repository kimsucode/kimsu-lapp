"use client";

import { FormEvent, useState } from "react";

type Props = {
  initialValues: {
    now_playing_title: string;
    now_playing_artist: string;
    spotify_embed_url: string;
    quote_of_day: string;
    latest_article_url: string;
  };
};

export function AdminSettingsForm({ initialValues }: Props) {
  const [values, setValues] = useState(initialValues);
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

    setIsLoading(false);
    setMessage(response.ok ? "Contenu mis à jour." : "Erreur de sauvegarde.");
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
          <label htmlFor="spotify">Lien embed Spotify</label>
          <input
            id="spotify"
            placeholder="https://open.spotify.com/embed/track/..."
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
          <label htmlFor="article">URL dernier article</label>
          <input
            id="article"
            type="url"
            placeholder="https://..."
            value={values.latest_article_url}
            onChange={(event) => setValues((v) => ({ ...v, latest_article_url: event.target.value }))}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </button>

        {message ? <p className="muted">{message}</p> : null}
      </form>
    </section>
  );
}
