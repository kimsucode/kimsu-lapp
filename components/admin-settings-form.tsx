"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  LoaderCircle,
  Music4,
  Newspaper,
  Plus,
  Quote,
  RefreshCw,
  Sparkles,
  Trash2
} from "lucide-react";

import type { DailyPhrase, HomeSectionKey, QuotePublicationMode } from "@/types/content";

type Props = {
  initialValues: {
    now_playing_title: string;
    now_playing_artist: string;
    spotify_embed_url: string;
    apple_music_url: string;
    quote_of_day: string;
    quote_of_day_mode: QuotePublicationMode;
    quote_of_day_updated_at: string | null;
    latest_article_url: string;
    editorial_feed_url: string;
    section_order: HomeSectionKey[];
  };
  initialDailyPhrases: DailyPhrase[];
  articlePreview: {
    url: string | null;
    title: string | null;
    excerpt: string | null;
    publishedAt: string | null;
    author: string | null;
  } | null;
  currentNowPlaying: {
    title: string | null;
    artist: string | null;
  };
};

type FeedbackTone = "success" | "error" | "neutral";

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  now_playing: "Now Playing",
  carousel: "Carousel",
  quote: "Phrase du jour",
  latest_article: "Dernier article"
};

function inputClassName() {
  return "w-full rounded-2xl border border-white/10 bg-[#12131a] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#d4c0a1]/45 focus:outline-none";
}

function cardClassName() {
  return "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,23,31,0.94),rgba(13,14,20,0.92))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur";
}

function formatDateTime(value: string | null): string {
  if (!value) return "Jamais publié";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatPublishedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function badgeClassName(tone: FeedbackTone) {
  if (tone === "success") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (tone === "error") return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  return "border-white/10 bg-white/5 text-white/70";
}

function modeLabel(mode: QuotePublicationMode) {
  return mode === "auto" ? "Automatique" : "Manuel";
}

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

export function AdminSettingsForm({ initialValues, initialDailyPhrases, articlePreview, currentNowPlaying }: Props) {
  const [editorial, setEditorial] = useState({
    feedUrl: initialValues.editorial_feed_url
  });
  const [quoteDraft, setQuoteDraft] = useState(initialValues.quote_of_day);
  const [quoteMode, setQuoteMode] = useState<QuotePublicationMode>(initialValues.quote_of_day_mode);
  const [quoteUpdatedAt, setQuoteUpdatedAt] = useState<string | null>(initialValues.quote_of_day_updated_at);
  const [publishedQuote, setPublishedQuote] = useState(initialValues.quote_of_day);
  const [sectionOrder, setSectionOrder] = useState<HomeSectionKey[]>(initialValues.section_order);
  const [dailyPhrases, setDailyPhrases] = useState<DailyPhrase[]>(initialDailyPhrases);
  const [newPhrase, setNewPhrase] = useState("");

  const [quoteFeedback, setQuoteFeedback] = useState<{ tone: FeedbackTone; text: string } | null>(null);
  const [phraseFeedback, setPhraseFeedback] = useState<{ tone: FeedbackTone; text: string } | null>(null);
  const [editorialFeedback, setEditorialFeedback] = useState<{ tone: FeedbackTone; text: string } | null>(null);
  const [orderFeedback, setOrderFeedback] = useState<{ tone: FeedbackTone; text: string } | null>(null);

  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [isAddingPhrase, setIsAddingPhrase] = useState(false);
  const [isSavingEditorial, setIsSavingEditorial] = useState(false);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [pendingPhraseId, setPendingPhraseId] = useState<string | null>(null);

  const activePhraseCount = useMemo(
    () => dailyPhrases.filter((item) => item.is_active).length,
    [dailyPhrases]
  );

  async function saveManualQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingQuote(true);
    setQuoteFeedback(null);

    const response = await fetch("/api/admin/quote-of-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: quoteDraft })
    });

    const payload = await readJson(response);
    setIsSavingQuote(false);

    if (!response.ok) {
      setQuoteFeedback({ tone: "error", text: String(payload.error ?? "Impossible de publier la phrase.") });
      return;
    }

    const nextQuote = String(payload.quote ?? quoteDraft);
    const nextUpdatedAt = typeof payload.updatedAt === "string" ? payload.updatedAt : new Date().toISOString();

    setPublishedQuote(nextQuote);
    setQuoteDraft(nextQuote);
    setQuoteMode("manual");
    setQuoteUpdatedAt(nextUpdatedAt);
    setQuoteFeedback({ tone: "success", text: "Phrase du jour publiée manuellement." });
  }

  async function generateQuote() {
    setIsGeneratingQuote(true);
    setQuoteFeedback(null);

    const response = await fetch("/api/admin/quote-of-day/generate", {
      method: "POST"
    });

    const payload = await readJson(response);
    setIsGeneratingQuote(false);

    if (!response.ok) {
      setQuoteFeedback({ tone: "error", text: String(payload.error ?? "Impossible de générer une phrase.") });
      return;
    }

    if (typeof payload.quote === "string") {
      setPublishedQuote(payload.quote);
      setQuoteDraft(payload.quote);
    }

    if (typeof payload.updatedAt === "string") {
      setQuoteUpdatedAt(payload.updatedAt);
    }

    if (payload.mode === "auto" || payload.mode === "manual") {
      setQuoteMode(payload.mode);
    }
    setDailyPhrases((current) =>
      current.map((item) =>
        item.id === payload.phraseId
          ? {
              ...item,
              last_used_at: typeof payload.updatedAt === "string" ? payload.updatedAt : new Date().toISOString(),
              times_used: item.times_used + 1
            }
          : item
      )
    );
    setQuoteFeedback({
      tone: payload.status === "published" ? "success" : "neutral",
      text: String(payload.reason ?? (payload.status === "published" ? "Nouvelle phrase publiée." : "Phrase conservée."))
    });
  }

  async function addPhrase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAddingPhrase(true);
    setPhraseFeedback(null);

    const response = await fetch("/api/admin/daily-phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase: newPhrase })
    });

    const payload = await readJson(response);
    setIsAddingPhrase(false);

    if (!response.ok) {
      setPhraseFeedback({ tone: "error", text: String(payload.error ?? "Impossible d'ajouter la phrase.") });
      return;
    }

    setDailyPhrases((current) => [payload.phrase as DailyPhrase, ...current]);
    setNewPhrase("");
    setPhraseFeedback({ tone: "success", text: "Phrase ajoutée à la base." });
  }

  async function updatePhrase(id: string, updates: { is_active: boolean }) {
    setPendingPhraseId(id);
    setPhraseFeedback(null);

    const response = await fetch(`/api/admin/daily-phrases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });

    const payload = await readJson(response);
    setPendingPhraseId(null);

    if (!response.ok) {
      setPhraseFeedback({ tone: "error", text: String(payload.error ?? "Impossible de mettre à jour la phrase.") });
      return;
    }

    setDailyPhrases((current) => current.map((item) => (item.id === id ? (payload.phrase as DailyPhrase) : item)));
    setPhraseFeedback({
      tone: "success",
      text: updates.is_active ? "Phrase réactivée." : "Phrase désactivée."
    });
  }

  async function deletePhrase(id: string) {
    setPendingPhraseId(id);
    setPhraseFeedback(null);

    const response = await fetch(`/api/admin/daily-phrases/${id}`, {
      method: "DELETE"
    });

    const payload = await readJson(response);
    setPendingPhraseId(null);

    if (!response.ok) {
      setPhraseFeedback({ tone: "error", text: String(payload.error ?? "Impossible de supprimer la phrase.") });
      return;
    }

    setDailyPhrases((current) => current.filter((item) => item.id !== id));
    setPhraseFeedback({ tone: "success", text: "Phrase supprimée." });
  }

  async function saveEditorial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingEditorial(true);
    setEditorialFeedback(null);

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editorial_feed_url: editorial.feedUrl
      })
    });

    const payload = await readJson(response);
    setIsSavingEditorial(false);

    if (!response.ok) {
      setEditorialFeedback({ tone: "error", text: String(payload.error ?? "Erreur de sauvegarde.") });
      return;
    }

    setEditorialFeedback({ tone: "success", text: "Paramètres éditoriaux mis à jour." });
  }

  async function refreshFeed() {
    setIsRefreshingFeed(true);
    setEditorialFeedback(null);

    const response = await fetch("/api/admin/editorial/refresh", {
      method: "POST"
    });

    setIsRefreshingFeed(false);

    if (!response.ok) {
      setEditorialFeedback({ tone: "error", text: "Impossible de rafraîchir le flux." });
      return;
    }

    setEditorialFeedback({ tone: "success", text: "Flux revalidé. Recharge la page pour voir l’aperçu à jour." });
  }

  function moveSection(section: HomeSectionKey, direction: "up" | "down") {
    setSectionOrder((current) => {
      const index = current.indexOf(section);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setOrderFeedback(null);
  }

  async function saveSectionOrder() {
    setIsSavingOrder(true);
    setOrderFeedback(null);

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_order: sectionOrder })
    });

    const payload = await readJson(response);
    setIsSavingOrder(false);

    if (!response.ok) {
      setOrderFeedback({ tone: "error", text: String(payload.error ?? "Impossible de sauvegarder l'ordre.") });
      return;
    }

    setOrderFeedback({ tone: "success", text: "Ordre de la homepage mis à jour." });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
        <section className={cardClassName()}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-white">
                Now Playing
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
                Morceau actuellement affiché sur l’app.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4c0a1]/20 bg-[#d4c0a1]/10 text-[#e8d7bd]">
              <Music4 size={18} />
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="overflow-hidden rounded-[28px] border border-[#d4c0a1]/14 bg-[radial-gradient(circle_at_top_left,rgba(212,192,161,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#d4c0a1]/62">Lecture en cours</p>
                  <p className="mt-3 max-w-[22rem] font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.96] text-white">
                    {currentNowPlaying.title || "Aucun morceau détecté"}
                  </p>
                  <p className="mt-4 text-sm tracking-[0.02em] text-white/58">
                    {currentNowPlaying.artist || "Le flux automatique n’a rien remonté pour le moment."}
                  </p>
                </div>

                <div className="rounded-full border border-[#d4c0a1]/16 bg-[#d4c0a1]/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#eadcc8]">
                  Auto
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#d4c0a1]/45 via-white/12 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section className={cardClassName()}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-white">
                Phrase du jour
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Pilotage manuel ou automatique, avec aperçu de la phrase actuellement publiée.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4c0a1]/20 bg-[#d4c0a1]/10 text-[#e8d7bd]">
              <Quote size={18} />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-[#d4c0a1]/14 bg-[radial-gradient(circle_at_top_left,rgba(212,192,161,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs ${badgeClassName("neutral")}`}>
                Statut: {modeLabel(quoteMode)}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs ${badgeClassName("neutral")}`}>
                Mise à jour: {formatDateTime(quoteUpdatedAt)}
              </span>
            </div>
            <blockquote className="mt-5 max-w-[30rem] font-[family:var(--font-cormorant)] text-[2.35rem] italic leading-[1.08] text-white/92">
              {publishedQuote || "Aucune phrase publiée pour le moment."}
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-[#d4c0a1]/45 via-white/12 to-transparent" />
            </div>
          </div>

          <form onSubmit={saveManualQuote} className="mt-5 space-y-4">
            <div>
              <label htmlFor="quoteDraft" className="mb-2 block text-sm text-white/70">
                Publier une phrase manuellement
              </label>
              <textarea
                id="quoteDraft"
                rows={5}
                className={inputClassName()}
                value={quoteDraft}
                onChange={(event) => setQuoteDraft(event.target.value)}
                placeholder="Écris ou colle la phrase à publier."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSavingQuote}
                className="inline-flex items-center gap-2 rounded-full border border-[#d4c0a1]/30 bg-[#d4c0a1]/12 px-5 py-2.5 text-sm font-medium text-[#f3e6d1] transition hover:bg-[#d4c0a1]/18 disabled:opacity-60"
              >
                {isSavingQuote ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
                {isSavingQuote ? "Publication..." : "Publier en manuel"}
              </button>
              <button
                type="button"
                onClick={generateQuote}
                disabled={isGeneratingQuote}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm text-white/82 transition hover:bg-white/10 disabled:opacity-60"
              >
                {isGeneratingQuote ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {isGeneratingQuote ? "Génération..." : "Forcer une nouvelle phrase"}
              </button>
              {quoteFeedback ? (
                <p className={`rounded-full border px-3 py-1.5 text-xs ${badgeClassName(quoteFeedback.tone)}`}>
                  {quoteFeedback.text}
                </p>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <section className={cardClassName()}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-white">
                Base de phrases
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {activePhraseCount} active{activePhraseCount > 1 ? "s" : ""} sur {dailyPhrases.length}. La rotation
                automatique puise ici chaque jour.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4c0a1]/20 bg-[#d4c0a1]/10 text-[#e8d7bd]">
              <Sparkles size={18} />
            </div>
          </div>

          <form
            onSubmit={addPhrase}
            className="mt-6 rounded-[28px] border border-[#d4c0a1]/14 bg-[radial-gradient(circle_at_top_left,rgba(212,192,161,0.1),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5"
          >
            <label htmlFor="newPhrase" className="mb-2 block text-sm text-white/70">
              Ajouter une phrase
            </label>
            <textarea
              id="newPhrase"
              rows={3}
              className={inputClassName()}
              value={newPhrase}
              onChange={(event) => setNewPhrase(event.target.value)}
              placeholder="Une phrase brève, propre, prête à publier."
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isAddingPhrase}
                className="inline-flex items-center gap-2 rounded-full border border-[#d4c0a1]/30 bg-[#d4c0a1]/12 px-5 py-2.5 text-sm font-medium text-[#f3e6d1] transition hover:bg-[#d4c0a1]/18 disabled:opacity-60"
              >
                {isAddingPhrase ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
                {isAddingPhrase ? "Ajout..." : "Ajouter à la base"}
              </button>
              {phraseFeedback ? (
                <p className={`rounded-full border px-3 py-1.5 text-xs ${badgeClassName(phraseFeedback.tone)}`}>
                  {phraseFeedback.text}
                </p>
              ) : null}
            </div>
          </form>

          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {dailyPhrases.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/55">
                Aucune phrase dans la base pour le moment.
              </div>
            ) : null}

            {dailyPhrases.map((item) => {
              const isPending = pendingPhraseId === item.id;
              const usedLabel = item.last_used_at ? `Utilisée ${formatDateTime(item.last_used_at)}` : "Jamais utilisée";

              return (
                <article
                  key={item.id}
                  className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${badgeClassName(item.is_active ? "success" : "neutral")}`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${badgeClassName(item.last_used_at ? "neutral" : "success")}`}
                    >
                      {item.last_used_at ? "Déjà utilisée" : "Nouvelle"}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs ${badgeClassName("neutral")}`}>
                      {item.times_used} diffusion{item.times_used > 1 ? "s" : ""}
                    </span>
                  </div>

                  <p className="mt-4 max-w-[42rem] font-[family:var(--font-cormorant)] text-[1.7rem] leading-[1.18] text-white/92">
                    {item.phrase}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/36">{usedLabel}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updatePhrase(item.id, { is_active: !item.is_active })}
                      disabled={isPending}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/76 transition hover:bg-white/10 disabled:opacity-60"
                    >
                      {item.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePhrase(item.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-300/12 bg-rose-300/8 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-300/12 disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      Supprimer
                    </button>
                    {isPending ? <LoaderCircle className="animate-spin text-white/40" size={15} /> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className={cardClassName()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-white">
                  Flux éditorial
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Paramètres du dernier article, avec aperçu simple du contenu résolu.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4c0a1]/20 bg-[#d4c0a1]/10 text-[#e8d7bd]">
                <Newspaper size={18} />
              </div>
            </div>

            <form onSubmit={saveEditorial} className="mt-6 space-y-4">
              <div>
                <label htmlFor="feedUrl" className="mb-2 block text-sm text-white/70">
                  URL flux RSS / Atom
                </label>
                <input
                  id="feedUrl"
                  type="url"
                  className={inputClassName()}
                  value={editorial.feedUrl}
                  onChange={(event) => setEditorial((current) => ({ ...current, feedUrl: event.target.value }))}
                  placeholder="https://tonsite.com/feed.xml"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSavingEditorial}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d4c0a1]/30 bg-[#d4c0a1]/12 px-5 py-2.5 text-sm font-medium text-[#f3e6d1] transition hover:bg-[#d4c0a1]/18 disabled:opacity-60"
                >
                  {isSavingEditorial ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
                  {isSavingEditorial ? "Sauvegarde..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={refreshFeed}
                  disabled={isRefreshingFeed}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm text-white/82 transition hover:bg-white/10 disabled:opacity-60"
                >
                  {isRefreshingFeed ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  {isRefreshingFeed ? "Rafraîchissement..." : "Rafraîchir le flux"}
                </button>
                {editorialFeedback ? (
                  <p className={`rounded-full border px-3 py-1.5 text-xs ${badgeClassName(editorialFeedback.tone)}`}>
                    {editorialFeedback.text}
                  </p>
                ) : null}
              </div>
            </form>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/38">Aperçu</p>
              <p className="mt-3 text-base font-medium text-white/90">
                {articlePreview?.title || "Aucun article détecté pour le moment."}
              </p>
              {articlePreview?.publishedAt || articlePreview?.author ? (
                <p className="mt-2 text-xs text-white/45">
                  {[formatPublishedDate(articlePreview?.publishedAt ?? null), articlePreview?.author]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-white/58">
                {articlePreview?.excerpt || "Le dernier article résolu depuis le flux ou l’URL fallback apparaîtra ici."}
              </p>
              {articlePreview?.url ? (
                <a
                  href={articlePreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm text-[#f3e6d1] underline underline-offset-4"
                >
                  Ouvrir l’article
                </a>
              ) : null}
            </div>
          </section>

          <section className={cardClassName()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#d4c0a1]/70">Bloc 5</p>
                <h2 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-white">
                  Ordre homepage
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Ajuste la hiérarchie de lecture sans sur-ingénierie.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {sectionOrder.map((section, index) => (
                <div
                  key={section}
                  className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white/88">{SECTION_LABELS[section]}</p>
                    <p className="text-xs text-white/38">Position {index + 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(section, "up")}
                      disabled={index === 0}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/72 transition hover:bg-white/10 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section, "down")}
                      disabled={index === sectionOrder.length - 1}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-white/72 transition hover:bg-white/10 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveSectionOrder}
                disabled={isSavingOrder}
                className="inline-flex items-center gap-2 rounded-full border border-[#d4c0a1]/30 bg-[#d4c0a1]/12 px-5 py-2.5 text-sm font-medium text-[#f3e6d1] transition hover:bg-[#d4c0a1]/18 disabled:opacity-60"
              >
                {isSavingOrder ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
                {isSavingOrder ? "Sauvegarde..." : "Enregistrer l’ordre"}
              </button>
              {orderFeedback ? (
                <p className={`rounded-full border px-3 py-1.5 text-xs ${badgeClassName(orderFeedback.tone)}`}>
                  {orderFeedback.text}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
