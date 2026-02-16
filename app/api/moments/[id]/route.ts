export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getMomentById } from "@/lib/data";

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const moment = await getMomentById(context.params.id);

    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable" }, { status: 404 });
    }

    return NextResponse.json({ moment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
