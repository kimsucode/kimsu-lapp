export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getSavedPhrases } from "@/lib/data";

export async function GET() {
  try {
    const phrases = await getSavedPhrases();
    return NextResponse.json({ phrases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = message.includes("relation \"saved_phrases\"")
      ? "Migration manquante: exécute supabase/migrations/004_add_moments_and_saved_phrases.sql"
      : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
