import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase-server";

type SettingsPayload = {
  now_playing_title?: string;
  now_playing_artist?: string;
  spotify_embed_url?: string;
  quote_of_day?: string;
  latest_article_url?: string;
};

function asNullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SettingsPayload;

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: 1,
      now_playing_title: asNullable(body.now_playing_title),
      now_playing_artist: asNullable(body.now_playing_artist),
      spotify_embed_url: asNullable(body.spotify_embed_url),
      quote_of_day: asNullable(body.quote_of_day),
      latest_article_url: asNullable(body.latest_article_url),
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}
