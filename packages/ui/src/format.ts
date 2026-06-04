// packages/ui/src/format.ts — locale-aware formatting. หอมฉลุย — Powered by 2T9COME.
import type { Locale } from "@homchalui/i18n";

const BCP47: Record<Locale, string> = { th: "th-TH", en: "en-US", zh: "zh-Hans" };

/** Money via Intl.NumberFormat (COMPONENT_LIBRARY convention). Falls back gracefully. */
export function formatPrice(amount: number, currency: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(BCP47[locale], { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
