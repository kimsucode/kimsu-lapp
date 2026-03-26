export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { publishManualQuoteOfDay } from "@/lib/daily-quote";

type QuotePayload = {
  quote?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuotePayload;
    const result = await publishManualQuoteOfDay(body.quote ?? "");

    if (result.status !== "published") {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint =
      message.includes("quote_of_day_mode") || message.includes("quote_of_day_updated_at")
        ? "Migration manquante: exécute supabase/migrations/009_add_daily_phrases_automation.sql"
        : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
