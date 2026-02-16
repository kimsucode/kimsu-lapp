import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.EDITORIAL_WEBHOOK_SECRET;
  if (!expected) return false;

  const tokenFromHeader = request.headers.get("x-webhook-secret");
  const tokenFromQuery = request.nextUrl.searchParams.get("secret");

  return tokenFromHeader === expected || tokenFromQuery === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("editorial-feed");
  revalidatePath("/");

  return NextResponse.json({ revalidated: true, path: "/" });
}
