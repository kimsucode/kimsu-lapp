import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/auth";

function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname === "/api/admin/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const targetsAdmin =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!targetsAdmin || isAdminLoginPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  const ok = await isValidAdminSession(session);

  if (!ok) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
