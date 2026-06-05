"use client";
// apps/web/components/RecentlyViewed.tsx — "viewed recently" strip. หอมฉลุย — Powered by 2T9COME.
import { useEffect, useState } from "react";
import type { Locale } from "@homchalui/i18n";
import { getRecent, subscribeRecent, type RecentItem } from "./recently-viewed-store";

const HEADING: Record<Locale, string> = { th: "ดูล่าสุด", en: "Recently viewed", zh: "最近浏览" };

export function RecentlyViewed({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    setItems(getRecent());
    return subscribeRecent(setItems);
  }, []);
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold text-brand-dark">{HEADING[locale]}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((it) => (
          <a key={it.href} href={it.href} className="w-32 shrink-0">
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-line bg-bg-soft">
              {it.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{it.name}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
