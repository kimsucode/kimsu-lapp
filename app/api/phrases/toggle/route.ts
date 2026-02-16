export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getAppSettings, toggleSavedPhrase } from "@/lib/data";

type ToggleBody = {
  phrase?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ToggleBody;

    const input = body.phrase?.trim();
    const sourcePhrase = input || (await getAppSettings())?.quote_of_day?.trim() || "";

    if (!sourcePhrase) {
      return NextResponse.json({ error: "Aucune phrase à sauvegarder." }, { status: 400 });
    }

    const saved = await toggleSavedPhrase(sourcePhrase);
    return NextResponse.json({ saved, phrase: sourcePhrase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = message.includes("relation \"saved_phrases\"")
      ? "Migration manquante: exécute supabase/migrations/004_add_moments_and_saved_phrases.sql"
      : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
