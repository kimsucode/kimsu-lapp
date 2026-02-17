export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getQuoteLikes } from "@/lib/quote-social";

function migrationHint(message: string): string {
  if (message.includes("relation \"quote_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/005_quote_likes_and_shares.sql";
  }

  return message;
}

export async function GET(request: NextRequest) {
  try {
    const quote = request.nextUrl.searchParams.get("quote")?.trim() ?? "";
    const fingerprint = request.headers.get("x-fingerprint")?.trim() || request.nextUrl.searchParams.get("fingerprint")?.trim() || "";

    if (!quote) {
      return NextResponse.json({ error: "Paramètre quote requis." }, { status: 400 });
    }

    const result = await getQuoteLikes(quote, fingerprint);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
