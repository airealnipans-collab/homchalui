// packages/ui/src/Badge.tsx — product badge primitive. หอมฉลุย — Powered by 2T9COME.
// Per docs/COMPONENT_LIBRARY.md: badge kind is DATA-DERIVED, never arbitrary. Each kind maps to
// a localized label + a design token color (docs/DESIGN_SYSTEM.md). Server-renderable.
import type { Locale } from "@homchalui/i18n";
import { cn } from "./cn";

export type BadgeKind = "trending" | "best_seller" | "best_value" | "luxury" | "long_lasting";

const LABELS: Record<BadgeKind, Record<Locale, string>> = {
  trending: { th: "มาแรง", en: "Trending", zh: "热门" },
  best_seller: { th: "ขายดี", en: "Best seller", zh: "畅销" },
  best_value: { th: "คุ้มสุด", en: "Best value", zh: "超值" },
  luxury: { th: "ลักชัวรี", en: "Luxury", zh: "奢华" },
  long_lasting: { th: "ติดทนนาน", en: "Long lasting", zh: "持久" },
};

// Token-based colors only (no ad-hoc brand colors — CLAUDE.md §3).
const STYLES: Record<BadgeKind, string> = {
  trending: "bg-warning/15 text-warning",
  best_seller: "bg-brand/10 text-brand",
  best_value: "bg-success/15 text-success",
  luxury: "bg-gold/15 text-brand-dark",
  long_lasting: "bg-lavender/30 text-brand-dark",
};

export function Badge({ kind, locale, className }: { kind: BadgeKind; locale: Locale; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        STYLES[kind],
        className,
      )}
    >
      {LABELS[kind][locale]}
    </span>
  );
}
