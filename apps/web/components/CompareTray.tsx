"use client";
// apps/web/components/CompareTray.tsx — floating compare bar. หอมฉลุย — Powered by 2T9COME.
// Reads the localStorage tray; links to the localized /compare?ids=… page. Hidden when empty.
import { useEffect, useState } from "react";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { getCompare, removeFromCompare, clearCompare, subscribeCompare, type CompareItem } from "./compare-store";

const L = {
  compare: { th: "เปรียบเทียบ", en: "Compare", zh: "对比" },
  clear: { th: "ล้าง", en: "Clear", zh: "清除" },
  items: { th: "รายการ", en: "items", zh: "件" },
} satisfies Record<string, Record<Locale, string>>;

export function CompareTray({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  useEffect(() => {
    setItems(getCompare());
    return subscribeCompare(setItems);
  }, []);

  if (items.length === 0) return null;
  const href = `${localizedPath(locale, "/compare")}?ids=${items.map((i) => i.id).join(",")}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
          <span className="text-text-muted">{items.length} {L.items[locale]}:</span>
          {items.map((i) => (
            <span key={i.id} className="flex items-center gap-1 rounded-full bg-bg-soft px-2 py-0.5 text-xs">
              {i.name}
              <button type="button" aria-label="remove" onClick={() => removeFromCompare(i.id)} className="text-text-muted hover:text-error">×</button>
            </span>
          ))}
        </div>
        <button type="button" onClick={clearCompare} className="text-xs text-text-muted hover:text-error">{L.clear[locale]}</button>
        <a
          href={href}
          className={`rounded-full px-4 py-1.5 text-sm font-medium text-white ${items.length >= 2 ? "bg-brand" : "pointer-events-none bg-line"}`}
        >
          {L.compare[locale]}
        </a>
      </div>
    </div>
  );
}
