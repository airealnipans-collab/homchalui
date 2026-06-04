// apps/web/middleware.ts — locale resolution + session id + guards. หอมฉลุย — Powered by 2T9COME.
// Rules (see I18N_RULES.md):
//  - Thai is default and has NO prefix. There is never a /th route → redirect /th/* to /*.
//  - /en and /zh are valid prefixes.
//  - Expose the resolved locale to layouts/pages via the x-locale REQUEST header.
//  - Issue a stable per-visitor session id (cookie hc_sid) and expose it via x-session-id so
//    server components can attach it to tracking on the very first request too.
//  - /admin is guarded (placeholder — wire real auth/RBAC here).
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SESSION_COOKIE } from "@/lib/session";

const PREFIXED = ["en", "zh"] as const;
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never allow a /th prefix — strip it and redirect to the canonical Thai URL.
  if (pathname === "/th" || pathname.startsWith("/th/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/th/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  // Backoffice guard: require a session for /admin/* (except the login page). Per-permission
  // checks happen in the route handlers (/api/admin/* guard themselves via requirePermission).
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?from=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  // Resolve locale from the first segment.
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  const locale = (PREFIXED as readonly string[]).includes(seg) ? seg : "th";

  // Stable session id: reuse the cookie if present, otherwise mint a new one.
  const existingSid = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existingSid ?? crypto.randomUUID();

  // Forward locale + session id as REQUEST headers so headers() reads them during render.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-session-id", sessionId);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Persist the session id so it is stable across visits.
  if (!existingSid) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: false, // readable by the client tracker (it is an analytics id, not auth)
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return res;
}

export const config = {
  // Skip static assets, image optimizer, and tracking/redirect endpoints.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.*|go/|api/).*)"],
};
