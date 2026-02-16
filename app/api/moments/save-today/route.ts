export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { saveTodayMoment } from "@/lib/data";

export async function POST() {
  try {
    const moment = await saveTodayMoment();
    return NextResponse.json({ moment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = message.includes("relation \"moments\"")
      ? "Migration manquante: exécute supabase/migrations/004_add_moments_and_saved_phrases.sql"
      : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
