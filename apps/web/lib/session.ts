// apps/web/lib/session.ts
// Per-visitor session id. หอมฉลุย — Powered by 2T9COME.
// The id is minted + persisted as the `hc_sid` cookie by middleware.ts and forwarded on every
// request via the `x-session-id` header, so server components can read it (even on the first
// visit, before the cookie round-trips) and attach it to tracking events. It is an ANALYTICS
// id only — never an auth/identity token.
import { headers, cookies } from "next/headers";

/** Cookie name for the stable per-visitor session id. */
export const SESSION_COOKIE = "hc_sid";

/** Request header middleware uses to forward the resolved session id to the render. */
export const SESSION_HEADER = "x-session-id";

/**
 * Read the current visitor's session id in a Server Component / Route Handler.
 * Prefers the header set by middleware (covers the first request); falls back to the cookie.
 * Returns "" only if middleware did not run (e.g. an excluded path) — callers should treat an
 * empty string as "no session".
 */
export function getSessionId(): string {
  const fromHeader = headers().get(SESSION_HEADER);
  if (fromHeader) return fromHeader;
  return cookies().get(SESSION_COOKIE)?.value ?? "";
}
