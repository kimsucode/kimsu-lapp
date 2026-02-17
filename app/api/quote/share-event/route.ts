export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { createQuoteShareEvent } from "@/lib/quote-social";

type ShareEventBody = {
  quote?: string;
  channel?: string;
};

function migrationHint(message: string): string {
  if (message.includes("relation \"quote_share_events\"")) {
    return "Migration manquante: exécute supabase/migrations/005_quote_likes_and_shares.sql";
  }

  return message;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ShareEventBody;
    const quote = body.quote?.trim() ?? "";
    const channel = body.channel?.trim() ?? "";

    if (!quote || !channel) {
      return NextResponse.json({ error: "quote et channel requis." }, { status: 400 });
    }

    await createQuoteShareEvent(quote, channel);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
