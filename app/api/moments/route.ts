export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getMoments } from "@/lib/data";

export async function GET() {
  try {
    const moments = await getMoments();
    return NextResponse.json({ moments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = message.includes("relation \"moments\"")
      ? "Migration manquante: exécute supabase/migrations/004_add_moments_and_saved_phrases.sql"
      : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
