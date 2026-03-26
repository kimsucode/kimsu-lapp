export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

type UpdateDailyPhrasePayload = {
  is_active?: boolean;
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as UpdateDailyPhrasePayload;

    if (typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active requis." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_phrases")
      .update({ is_active: body.is_active })
      .eq("id", params.id)
      .select("id, phrase, is_active, last_used_at, times_used, created_at, updated_at")
      .single();

    if (error || !data) {
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

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("daily_phrases").delete().eq("id", params.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = message.includes("relation \"daily_phrases\"")
      ? "Migration manquante: exécute supabase/migrations/009_add_daily_phrases_automation.sql"
      : message;

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
