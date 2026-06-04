"use client";
// apps/web/components/analytics/ScrollDepthTracker.tsx — fires scroll_depth at 25/50/75/100%.
// หอมฉลุย — Powered by 2T9COME. Each threshold fires at most once.
import { useEffect } from "react";
import type { Locale } from "@homchalui/i18n";
import { scrollDepth } from "@homchalui/analytics";

const THRESHOLDS = [25, 50, 75, 100];

export function ScrollDepthTracker({ locale, pageType }: { locale: Locale; pageType: string }) {
  useEffect(() => {
    const seen = new Set<number>();
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 100 : Math.min(100, Math.round(((doc.scrollTop || window.scrollY) / max) * 100));
      for (const t of THRESHOLDS) {
        if (pct >= t && !seen.has(t)) {
          seen.add(t);
          scrollDepth(locale, t, pageType);
        }
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [locale, pageType]);
  return null;
}
