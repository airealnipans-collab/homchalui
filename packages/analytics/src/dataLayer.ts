// packages/analytics/src/dataLayer.ts — the dataLayer contract. หอมฉลุย — Powered by 2T9COME.
// Builds the GtmEvent envelope (locale + session_id + page_url + timestamp REQUIRED on every
// event — TRACKING_EVENTS.md) and pushes to window.dataLayer. In development each event is
// validated against packages/validators/tracking so drift is caught early.
import type { Locale } from "@homchalui/i18n";
import { trackingEventStrict, type TrackingEventName } from "@homchalui/validators";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const SESSION_COOKIE = "hc_sid";

export type GtmEvent = Record<string, unknown> & { event: TrackingEventName; locale: Locale };

export interface EventCtx {
  pageUrl: string;
  sessionId: string;
  now: string;
  userId?: string;
  device?: "mobile" | "tablet" | "desktop";
}

/** Pure envelope builder (testable without a DOM). Fixed envelope fields win over `params`. */
export function buildEvent(
  event: TrackingEventName,
  locale: Locale,
  params: Record<string, unknown>,
  ctx: EventCtx,
): GtmEvent {
  return {
    ...params,
    event,
    locale,
    page_url: ctx.pageUrl,
    session_id: ctx.sessionId,
    timestamp: ctx.now,
    ...(ctx.userId ? { user_id: ctx.userId } : {}),
    ...(ctx.device ? { device: ctx.device } : {}),
  };
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Push a catalog event to the dataLayer (client only). Fills the common envelope + validates (dev). */
export function pushEvent(event: TrackingEventName, locale: Locale, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const ctx: EventCtx = {
    pageUrl: window.location.pathname + window.location.search,
    sessionId: readCookie(SESSION_COOKIE) ?? "anon",
    now: new Date().toISOString(),
  };
  const payload = buildEvent(event, locale, params, ctx);

  if (process.env.NODE_ENV !== "production") {
    const res = trackingEventStrict.safeParse(payload);
    if (!res.success) console.warn(`[analytics] "${event}" failed validation:`, res.error.issues);
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

/** Back-compat alias used across the UI components. */
export const track = pushEvent;
