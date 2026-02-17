export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { toggleQuoteLike } from "@/lib/quote-social";

type ToggleBody = {
  quote?: string;
};

function migrationHint(message: string): string {
  if (message.includes("relation \"quote_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/005_quote_likes_and_shares.sql";
  }

  return message;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ToggleBody;
    const quote = body.quote?.trim() ?? "";
    const fingerprint = request.headers.get("x-fingerprint")?.trim() ?? "";

    if (!quote) {
      return NextResponse.json({ error: "Quote requise." }, { status: 400 });
    }

    if (!fingerprint) {
      return NextResponse.json({ error: "Fingerprint requis." }, { status: 400 });
    }

    const result = await toggleQuoteLike(quote, fingerprint);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
