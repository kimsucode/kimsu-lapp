export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, signAdminSession } from "@/lib/auth";
import { getAuthEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body?.password ?? "").trim();
    const { ADMIN_PASSWORD } = getAuthEnv();

    if (!password || password !== ADMIN_PASSWORD.trim()) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const session = await signAdminSession();
    const res = NextResponse.json({ ok: true });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch (err) {
    console.error("POST /api/admin/login failed:", err);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
}
