"use client";
// packages/ui/src/track.ts — client dataLayer push. หอมฉลุย — Powered by 2T9COME.
// Every analytics event carries `locale` (CLAUDE.md §2.5). Event names are constrained to the
// canonical catalog (packages/validators). Fire-and-forget; never throws on the UI path.
import type { Locale } from "@homchalui/i18n";
import type { TrackingEventName } from "@homchalui/validators";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: TrackingEventName, locale: Locale, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, locale, ...payload, timestamp: new Date().toISOString() });
}
