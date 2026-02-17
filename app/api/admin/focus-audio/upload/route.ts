import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getPublicFocusAudioUrl } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

function sanitizeLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

function fallbackLabel(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  return sanitizeLabel(withoutExt) || "Son";
}

function isAcceptedAudio(file: File): boolean {
  if (file.type.startsWith("audio/")) {
    return true;
  }

  return /\.(mp3|wav|m4a|ogg)$/i.test(file.name);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const labelInput = String(formData.get("label") ?? "");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!isAcceptedAudio(audio)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { count } = await supabase.from("focus_audio_tracks").select("id", { count: "exact", head: true });

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Maximum 10 tracks" }, { status: 400 });
  }

  const buffer = Buffer.from(await audio.arrayBuffer());
  const id = randomUUID();
  const storagePath = `${Date.now()}-${sanitizeFileName(audio.name)}`;
  const label = sanitizeLabel(labelInput) || fallbackLabel(audio.name);

  const upload = await supabase.storage.from("focus-audio").upload(storagePath, buffer, {
    contentType: audio.type || "audio/mpeg",
    upsert: false
  });

  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const insert = await supabase
    .from("focus_audio_tracks")
    .insert({ id, label, storage_path: storagePath, sort_order: Number.isFinite(sortOrder) ? sortOrder : 0 })
    .select("id, label, storage_path, sort_order")
    .single();

  if (insert.error || !insert.data) {
    await supabase.storage.from("focus-audio").remove([storagePath]);
    return NextResponse.json({ error: insert.error?.message || "Insert failed" }, { status: 500 });
  }

  revalidatePath("/focus");
  revalidatePath("/admin");

  return NextResponse.json({
    track: {
      id: insert.data.id,
      label: insert.data.label,
      storagePath: insert.data.storage_path,
      sortOrder: insert.data.sort_order,
      url: getPublicFocusAudioUrl(insert.data.storage_path)
    }
  });
}
