export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { generateNextQuoteOfDay } from "@/lib/daily-quote";
import { getCronEnv } from "@/lib/env";

function isAuthorized(request: NextRequest) {
  const secret = getCronEnv().CRON_SECRET;
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateNextQuoteOfDay();

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
