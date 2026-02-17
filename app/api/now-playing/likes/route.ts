export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getSongLikes } from "@/lib/media-likes";

function migrationHint(message: string): string {
  if (message.includes("relation \"song_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/006_song_and_image_likes.sql";
  }

  return message;
}

export async function GET(request: NextRequest) {
  try {
    const songKey = request.nextUrl.searchParams.get("songKey")?.trim() ?? "";
    const fingerprint = request.headers.get("x-fingerprint")?.trim() ?? "";

    if (!songKey) {
      return NextResponse.json({ error: "Paramètre songKey requis." }, { status: 400 });
    }

    const result = await getSongLikes(songKey, fingerprint);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
