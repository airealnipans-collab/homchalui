// apps/web/middleware.ts — locale resolution + guards. หอมฉลุย — Powered by 2T9COME.
// Rules (see I18N_RULES.md):
//  - Thai is default and has NO prefix. There is never a /th route → redirect /th/* to /*.
//  - /en and /zh are valid prefixes.
//  - Expose the resolved locale via the x-locale header for layouts/pages.
//  - /admin is guarded (placeholder — wire real auth/RBAC here).
import { NextResponse, type NextRequest } from "next/server";

const PREFIXED = ["en", "zh"] as const;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never allow a /th prefix — strip it and redirect to the canonical Thai URL.
  if (pathname === "/th" || pathname.startsWith("/th/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/th/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  // Resolve locale from the first segment.
  const seg = pathname.split("/").filter(Boolean)[0];
  const locale = (PREFIXED as readonly string[]).includes(seg) ? seg : "th";

  // Admin guard placeholder (replace with NextAuth session + RBAC check).
  if (pathname.startsWith("/admin")) {
    // const session = await getSession(req); if (!session) return NextResponse.redirect(loginUrl);
    // Intentionally pass through for now; real guard added with auth.
  }

  const res = NextResponse.next();
  res.headers.set("x-locale", locale);
  return res;
}

export const config = {
  // Skip static assets, image optimizer, and tracking/redirect endpoints.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.*|go/|api/).*)"],
};
