import "server-only";

import { getAppSettings, getDailyPhrases } from "@/lib/data";
import { parisDayISO } from "@/lib/date";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { DailyPhrase, QuotePublicationMode } from "@/types/content";

type QuotePublishResult =
  | {
      status: "published";
      quote: string;
      mode: QuotePublicationMode;
      updatedAt: string;
      phraseId: string | null;
    }
  | {
      status: "skipped" | "kept_current";
      quote: string | null;
      mode: QuotePublicationMode;
      updatedAt: string | null;
      phraseId: string | null;
      reason: string;
    };

function normalizePhraseText(value: string | null | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized ? normalized : null;
}

function compareIsoDate(a: string | null, b: string | null) {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a.localeCompare(b);
}

function sortPhrasePool(items: DailyPhrase[]) {
  return [...items].sort((a, b) => {
    const lastUsed = compareIsoDate(a.last_used_at, b.last_used_at);
    if (lastUsed !== 0) return lastUsed;
    return a.created_at.localeCompare(b.created_at);
  });
}

function pickNextDailyPhrase(pool: DailyPhrase[], currentQuote: string | null): DailyPhrase | null {
  if (!pool.length) return null;

  const current = normalizePhraseText(currentQuote);
  const active = pool.filter((item) => item.is_active && normalizePhraseText(item.phrase));
  if (!active.length) return null;

  const neverUsed = active.filter((item) => item.last_used_at === null);
  const neverUsedOther = neverUsed.filter((item) => normalizePhraseText(item.phrase) !== current);

  if (neverUsedOther.length) {
    return sortPhrasePool(neverUsedOther)[0];
  }

  if (neverUsed.length) {
    return sortPhrasePool(neverUsed)[0];
  }

  const usedOther = sortPhrasePool(active).filter((item) => normalizePhraseText(item.phrase) !== current);
  if (usedOther.length) {
    return usedOther[0];
  }

  return sortPhrasePool(active)[0] ?? null;
}

async function upsertQuoteOfDay(quote: string, mode: QuotePublicationMode, phrase: DailyPhrase | null) {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: 1,
      quote_of_day: quote,
      quote_of_day_mode: mode,
      quote_of_day_updated_at: now,
      updated_at: now
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Failed to publish quote of day: ${error.message}`);
  }

  if (phrase) {
    const { error: phraseError } = await supabase
      .from("daily_phrases")
      .update({
        last_used_at: now,
        times_used: phrase.times_used + 1
      })
      .eq("id", phrase.id);

    if (phraseError) {
      throw new Error(`Failed to mark daily phrase as used: ${phraseError.message}`);
    }
  }

  return { updatedAt: now, quote, mode, phraseId: phrase?.id ?? null };
}

export async function publishManualQuoteOfDay(rawQuote: string): Promise<QuotePublishResult> {
  const quote = normalizePhraseText(rawQuote);

  if (!quote) {
    return {
      status: "kept_current",
      quote: null,
      mode: "manual",
      updatedAt: null,
      phraseId: null,
      reason: "La phrase est vide."
    };
  }

  const result = await upsertQuoteOfDay(quote, "manual", null);

  return {
    status: "published",
    quote: result.quote,
    mode: result.mode,
    updatedAt: result.updatedAt,
    phraseId: null
  };
}

export async function generateNextQuoteOfDay({ force = false }: { force?: boolean } = {}): Promise<QuotePublishResult> {
  const [settings, phrases] = await Promise.all([getAppSettings(), getDailyPhrases()]);
  const today = parisDayISO();
  const currentUpdatedDay = settings?.quote_of_day_updated_at
    ? parisDayISO(new Date(settings.quote_of_day_updated_at))
    : null;

  if (!force && settings?.quote_of_day_mode === "auto" && currentUpdatedDay === today) {
    return {
      status: "skipped",
      quote: settings.quote_of_day ?? null,
      mode: "auto",
      updatedAt: settings.quote_of_day_updated_at ?? null,
      phraseId: null,
      reason: "La phrase du jour a déjà été générée aujourd'hui."
    };
  }

  const nextPhrase = pickNextDailyPhrase(phrases, settings?.quote_of_day ?? null);

  if (!nextPhrase) {
    return {
      status: "kept_current",
      quote: settings?.quote_of_day ?? null,
      mode: settings?.quote_of_day_mode ?? "auto",
      updatedAt: settings?.quote_of_day_updated_at ?? null,
      phraseId: null,
      reason: "Aucune phrase active valide n'est disponible."
    };
  }

  const normalized = normalizePhraseText(nextPhrase.phrase);
  if (!normalized) {
    return {
      status: "kept_current",
      quote: settings?.quote_of_day ?? null,
      mode: settings?.quote_of_day_mode ?? "auto",
      updatedAt: settings?.quote_of_day_updated_at ?? null,
      phraseId: null,
      reason: "La phrase sélectionnée est invalide."
    };
  }

  const result = await upsertQuoteOfDay(normalized, "auto", nextPhrase);

  return {
    status: "published",
    quote: result.quote,
    mode: result.mode,
    updatedAt: result.updatedAt,
    phraseId: nextPhrase.id
  };
}
