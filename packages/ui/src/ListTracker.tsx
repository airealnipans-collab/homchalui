"use client";
// packages/ui/src/ListTracker.tsx — fires view_item_list once when a list scrolls into view.
// หอมฉลุย — Powered by 2T9COME. Invisible; used by ProductGrid (COMPONENT_LIBRARY).
import { useEffect, useRef } from "react";
import type { Locale } from "@homchalui/i18n";
import { track } from "./track";

export function ListTracker({ locale, listName, count }: { locale: Locale; listName: string; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true;
            track("view_item_list", locale, { list_name: listName, results_count: count });
            io.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [locale, listName, count]);

  return <div ref={ref} aria-hidden="true" className="h-0 w-0" />;
}
