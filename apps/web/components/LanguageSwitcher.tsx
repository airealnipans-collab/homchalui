"use client";
// apps/web/components/LanguageSwitcher.tsx — locale switcher. หอมฉลุย — Powered by 2T9COME.
// Maps to the EQUIVALENT entity in the target locale by reading the page's hreflang <link> tags
// (emitted from per-entity alternates). If a locale has no published translation it is shown
// disabled ("not available") — NEVER a Thai fallback. For generic pages with no hreflang (home,
// search) it falls back to swapping the locale prefix on the current path.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LOCALES, localizedPath, type Locale } from "@homchalui/i18n";

const LABEL: Record<Locale, string> = { th: "ไทย", en: "EN", zh: "中文" };

export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const [alts, setAlts] = useState<Partial<Record<Locale, string>>>({});
  const [entityMode, setEntityMode] = useState(false);

  useEffect(() => {
    const map: Partial<Record<Locale, string>> = {};
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
      const hl = el.getAttribute("hreflang");
      const href = el.getAttribute("href");
      if (href && (hl === "th" || hl === "en" || hl === "zh")) map[hl] = href;
    });
    setAlts(map);
    setEntityMode(Object.keys(map).length > 0);
  }, [pathname]);

  function hrefFor(loc: Locale): string | null {
    if (alts[loc]) return alts[loc]!;
    if (entityMode) return null; // entity has no published translation in this locale
    // Generic fallback: swap the locale prefix on the current path.
    const segs = pathname.split("/").filter(Boolean);
    const first = segs[0];
    const rest = first === "en" || first === "zh" ? segs.slice(1) : segs;
    const base = `/${rest.join("/")}`;
    return localizedPath(loc, base === "/" ? "/" : base);
  }

  return (
    <div className="flex items-center gap-1.5 text-sm" role="group" aria-label="Language">
      <span className="ti ti-world text-[16px] text-brand-dark" aria-hidden="true" />
      {LOCALES.map((loc, i) => {
        const sep = i > 0 ? <span className="text-line" aria-hidden="true">·</span> : null;
        if (loc === current) {
          return (
            <span key={loc} className="contents">
              {sep}
              <span className="font-semibold text-brand-dark" aria-current="true">{LABEL[loc]}</span>
            </span>
          );
        }
        const href = hrefFor(loc);
        return (
          <span key={loc} className="contents">
            {sep}
            {href ? (
              <a href={href} hrefLang={loc} className="text-text-secondary hover:text-brand">{LABEL[loc]}</a>
            ) : (
              <span className="cursor-not-allowed text-text-muted opacity-40" title="ยังไม่มีในภาษานี้">{LABEL[loc]}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
