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

function getParisHour(date = new Date()): number | null {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value;
  if (!hour) return null;

  const parsed = Number(hour);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parisHour = getParisHour();

    if (parisHour !== 0) {
      return NextResponse.json({
        status: "skipped",
        reason: "Hors fenêtre minuit Europe/Paris.",
        parisHour
      });
    }

    const result = await generateNextQuoteOfDay();

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
