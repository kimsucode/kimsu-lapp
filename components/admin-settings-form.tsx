"use client";

import { FormEvent, useState } from "react";

type Props = {
  initialValues: {
    spotify_embed_url: string;
    apple_music_url: string;
    quote_of_day: string;
    latest_article_url: string;
    editorial_feed_url: string;
  };
};

function inputClassName() {
  return "w-full rounded-xl border border-borderSubtle bg-[#14141c] px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-lavender/45 focus:outline-none";
}

export function AdminSettingsForm({ initialValues }: Props) {
  const [values, setValues] = useState(initialValues);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

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

  async function onRefreshFeed() {
    setIsRefreshingFeed(true);
    setMessage(null);

    const response = await fetch("/api/admin/editorial/refresh", {
      method: "POST"
    });

    if (!response.ok) {
      setMessage("Impossible de rafraîchir le flux.");
      setIsRefreshingFeed(false);
      return;
    }

    setMessage("Flux éditorial rafraîchi. Recharge la home pour voir la mise à jour.");
    setIsRefreshingFeed(false);
  }

  return (
    <section className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Contenu Home</h2>
        <p className="mt-1 text-sm text-textSecondary">Paramètres éditoriaux.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-borderSubtle/70 bg-[#121219] p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-textMuted">Now Playing</p>
          <div>
            <label htmlFor="spotify" className="mb-1.5 block text-sm text-textSecondary">
              Lien Spotify
            </label>
            <input
              id="spotify"
              className={inputClassName()}
              placeholder="https://open.spotify.com/track/..."
              value={values.spotify_embed_url}
              onChange={(event) => setValues((v) => ({ ...v, spotify_embed_url: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="appleMusic" className="mb-1.5 block text-sm text-textSecondary">
              Lien Apple Music (conversion auto vers Spotify)
            </label>
            <input
              id="appleMusic"
              className={inputClassName()}
              placeholder="https://music.apple.com/..."
              value={values.apple_music_url}
              onChange={(event) => setValues((v) => ({ ...v, apple_music_url: event.target.value }))}
            />
            <p className="mt-1 text-xs text-textMuted">
              Si le champ Spotify est vide, l&apos;app tentera de convertir automatiquement ce lien en Spotify.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-borderSubtle/70 bg-[#121219] p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-textMuted">Éditorial</p>

          <div>
            <label htmlFor="quote" className="mb-1.5 block text-sm text-textSecondary">
              Phrase du jour
            </label>
            <textarea
              id="quote"
              rows={4}
              className={inputClassName()}
              value={values.quote_of_day}
              onChange={(event) => setValues((v) => ({ ...v, quote_of_day: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="article" className="mb-1.5 block text-sm text-textSecondary">
              URL dernier article (fallback)
            </label>
            <input
              id="article"
              type="url"
              className={inputClassName()}
              placeholder="https://..."
              value={values.latest_article_url}
              onChange={(event) => setValues((v) => ({ ...v, latest_article_url: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="feed" className="mb-1.5 block text-sm text-textSecondary">
              URL flux RSS/Atom
            </label>
            <input
              id="feed"
              type="url"
              className={inputClassName()}
              placeholder="https://tonblog.com/feed.xml"
              value={values.editorial_feed_url}
              onChange={(event) => setValues((v) => ({ ...v, editorial_feed_url: event.target.value }))}
            />
            <div className="mt-2">
              <button
                type="button"
                className="rounded-full border border-borderSubtle bg-[#1a1a22] px-4 py-2 text-sm text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
                onClick={onRefreshFeed}
                disabled={isRefreshingFeed}
              >
                {isRefreshingFeed ? "Rafraîchissement..." : "Rafraîchir le flux éditorial"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full border border-lavender/45 bg-lavender/20 px-5 py-2.5 text-sm font-medium text-lavender transition-colors duration-300 ease-calm hover:bg-lavender/30"
          >
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </button>

          {message ? <p className="text-sm text-textSecondary">{message}</p> : null}
        </div>
      </form>
    </section>
  );
}
