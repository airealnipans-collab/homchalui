"use client";
// packages/ui/src/FAQBlock.tsx — accordion FAQ. หอมฉลุย — Powered by 2T9COME.
// Page emits the FAQPage JSON-LD from the same items (this renders markup only).
import { useState } from "react";
import type { Locale } from "@homchalui/i18n";
import { cn } from "./cn";

export interface FaqItem {
  q: string;
  a: string;
}

const HEADING: Record<Locale, string> = { th: "คำถามที่พบบ่อย", en: "FAQ", zh: "常见问题" };

export function FAQBlock({ items, locale }: { items: FaqItem[]; locale: Locale }) {
  const [open, setOpen] = useState<number | null>(0);
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold text-brand-dark">{HEADING[locale]}</h2>
      <div className="divide-y divide-line rounded-2xl border border-line">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-text-main"
              >
                {item.q}
                <span className={cn("ti ti-chevron-down transition", isOpen && "rotate-180")} aria-hidden="true" />
              </button>
              {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-text-secondary">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
