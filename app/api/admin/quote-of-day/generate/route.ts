export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { generateNextQuoteOfDay } from "@/lib/daily-quote";

export async function POST() {
  try {
    const result = await generateNextQuoteOfDay({ force: true });

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint =
      message.includes("daily_phrases") || message.includes("quote_of_day_mode")
        ? "Migration manquante: exécute supabase/migrations/009_add_daily_phrases_automation.sql"
        : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
