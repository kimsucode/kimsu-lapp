import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { id?: string };

  if (!body.id) {
    return NextResponse.json({ error: "Missing track id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const existing = await supabase
    .from("focus_audio_tracks")
    .select("id, storage_path")
    .eq("id", body.id)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }

  if (!existing.data) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const removeStorage = await supabase.storage.from("focus-audio").remove([existing.data.storage_path]);

  if (removeStorage.error) {
    return NextResponse.json({ error: removeStorage.error.message }, { status: 500 });
  }

  const removeRow = await supabase.from("focus_audio_tracks").delete().eq("id", body.id);

  if (removeRow.error) {
    return NextResponse.json({ error: removeRow.error.message }, { status: 500 });
  }

  revalidatePath("/focus");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}
