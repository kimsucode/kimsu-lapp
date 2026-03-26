export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

type CreateDailyPhrasePayload = {
  phrase?: string;
};

function normalizePhrase(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateDailyPhrasePayload;
    const phrase = normalizePhrase(body.phrase);

    if (!phrase) {
      return NextResponse.json({ error: "La phrase est vide." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_phrases")
      .insert({ phrase, is_active: true })
      .select("id, phrase, is_active, last_used_at, times_used, created_at, updated_at")
      .single();

    if (error || !data) {
      if (error?.message.includes("duplicate key")) {
        return NextResponse.json({ error: "Cette phrase existe déjà." }, { status: 409 });
      }

      throw new Error(error?.message ?? "Unknown error");
    }

    revalidatePath("/admin");

    return NextResponse.json({ phrase: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = message.includes("relation \"daily_phrases\"")
      ? "Migration manquante: exécute supabase/migrations/009_add_daily_phrases_automation.sql"
      : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
