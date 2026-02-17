import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase-server";

type LikeResult = {
  count: number;
  likedByMe: boolean;
};

function normalizeQuote(quote: string): string {
  return quote.trim();
}

export async function getQuoteLikes(quote: string, fingerprint?: string): Promise<LikeResult> {
  const normalizedQuote = normalizeQuote(quote);
  const normalizedFingerprint = fingerprint?.trim() ?? "";

  if (!normalizedQuote) {
    throw new Error("Quote is required");
  }

  const supabase = getSupabaseServerClient();

  const countResult = await supabase
    .from("quote_likes")
    .select("id", { count: "exact", head: true })
    .eq("quote_text", normalizedQuote);

  if (countResult.error) {
    throw new Error(`Failed to load quote like count: ${countResult.error.message}`);
  }

  if (!normalizedFingerprint) {
    return {
      count: countResult.count ?? 0,
      likedByMe: false
    };
  }

  const likedResult = await supabase
    .from("quote_likes")
    .select("id")
    .eq("quote_text", normalizedQuote)
    .eq("fingerprint", normalizedFingerprint)
    .maybeSingle();

  if (likedResult.error) {
    throw new Error(`Failed to check quote like: ${likedResult.error.message}`);
  }

  return {
    count: countResult.count ?? 0,
    likedByMe: Boolean(likedResult.data?.id)
  };
}

export async function toggleQuoteLike(quote: string, fingerprint: string): Promise<LikeResult> {
  const normalizedQuote = normalizeQuote(quote);
  const normalizedFingerprint = fingerprint.trim();

  if (!normalizedQuote) {
    throw new Error("Quote is required");
  }

  if (!normalizedFingerprint) {
    throw new Error("Fingerprint is required");
  }

  const supabase = getSupabaseServerClient();

  const existing = await supabase
    .from("quote_likes")
    .select("id")
    .eq("quote_text", normalizedQuote)
    .eq("fingerprint", normalizedFingerprint)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to toggle quote like: ${existing.error.message}`);
  }

  if (existing.data?.id) {
    const remove = await supabase.from("quote_likes").delete().eq("id", existing.data.id);

    if (remove.error) {
      throw new Error(`Failed to remove quote like: ${remove.error.message}`);
    }
  } else {
    const insert = await supabase
      .from("quote_likes")
      .insert({ quote_text: normalizedQuote, fingerprint: normalizedFingerprint });

    if (insert.error) {
      throw new Error(`Failed to save quote like: ${insert.error.message}`);
    }
  }

  return getQuoteLikes(normalizedQuote, normalizedFingerprint);
}

export async function createQuoteShareEvent(quote: string, channel: string): Promise<void> {
  const normalizedQuote = normalizeQuote(quote);
  const normalizedChannel = channel.trim();

  if (!normalizedQuote || !normalizedChannel) {
    return;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("quote_share_events").insert({
    quote_text: normalizedQuote,
    channel: normalizedChannel
  });

  if (error) {
    throw new Error(`Failed to log quote share event: ${error.message}`);
  }
}
