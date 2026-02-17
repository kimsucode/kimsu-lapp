export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getImageLikes } from "@/lib/media-likes";

function migrationHint(message: string): string {
  if (message.includes("relation \"image_likes\"")) {
    return "Migration manquante: exécute supabase/migrations/006_song_and_image_likes.sql";
  }

  return message;
}

export async function GET(request: NextRequest) {
  try {
    const imageId = request.nextUrl.searchParams.get("imageId")?.trim() ?? "";
    const fingerprint = request.headers.get("x-fingerprint")?.trim() ?? "";

    if (!imageId) {
      return NextResponse.json({ error: "Paramètre imageId requis." }, { status: 400 });
    }

    const result = await getImageLikes(imageId, fingerprint);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? migrationHint(error.message) : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
