export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { toggleSongLike } from "@/lib/media-likes";

type ToggleBody = {
  songKey?: string;
  title?: string;
  artist?: string;
};

function migrationHint(message: string): string {
  if (message.includes("relation \"song_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/006_song_and_image_likes.sql";
  }

  return message;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ToggleBody;
    const songKey = body.songKey?.trim() ?? "";
    const fingerprint = request.headers.get("x-fingerprint")?.trim() ?? "";

    if (!songKey) {
      return NextResponse.json({ error: "songKey requis." }, { status: 400 });
    }

    if (!fingerprint) {
      return NextResponse.json({ error: "Fingerprint requis." }, { status: 400 });
    }

    const result = await toggleSongLike(songKey, fingerprint, {
      title: body.title ?? null,
      artist: body.artist ?? null
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
