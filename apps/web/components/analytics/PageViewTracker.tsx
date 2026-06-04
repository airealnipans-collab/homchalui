"use client";
// apps/web/components/analytics/PageViewTracker.tsx — fires page_view on each route view.
// หอมฉลุย — Powered by 2T9COME. Re-fires on client-side navigation (pathname change).
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@homchalui/i18n";
import { pageView } from "@homchalui/analytics";

export function PageViewTracker({ locale, pageType }: { locale: Locale; pageType?: string }) {
  const pathname = usePathname();
  useEffect(() => {
    pageView(locale, pageType);
  }, [locale, pathname, pageType]);
  return null;
}
