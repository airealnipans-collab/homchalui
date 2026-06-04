"use client";
// apps/web/components/MerchantButton.tsx
// Tracked buy button. หอมฉลุย — Powered by 2T9COME.
// Layout: merchant name · price · filled "สั่งซื้อ" pill. Pushes a GTM dataLayer event, then
// navigates to /go/:linkId (records server-side, 302s to the affiliate URL). It NEVER links to
// the raw affiliate URL directly.
import type { Locale } from "@homchalui/i18n";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

interface Props {
  linkId: string;
  merchant: string;
  productId: string;
  productName: string;
  locale: Locale;
  price?: number | null;
  currency?: string;
  sessionId: string;
  sourcePage: string;
  /** Highlight the cheapest merchant. */
  cheapest?: boolean;
}

export function MerchantButton({
  linkId, merchant, productId, productName, locale, price, currency = "THB",
  sessionId, sourcePage, cheapest = false,
}: Props) {
  const href = `/go/${linkId}?locale=${locale}&sid=${encodeURIComponent(sessionId)}&src=${encodeURIComponent(sourcePage)}`;

  function onClick() {
    window.dataLayer?.push({
      event: "click_merchant_link",
      locale, // REQUIRED on every event
      product_id: productId,
      product_name: productName,
      merchant,
      price: price ?? undefined,
      session_id: sessionId,
      page_url: sourcePage,
      timestamp: new Date().toISOString(),
    });
  }

  const rowBorder = cheapest ? "border-[1.5px] border-success" : "border border-line";
  const pill = cheapest
    ? "bg-brand text-white"
    : "bg-bg-soft text-brand border border-gold";

  return (
    <a
      href={href}
      onClick={onClick}
      rel="nofollow sponsored noopener"
      className={`flex items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 transition hover:bg-pink/20 ${rowBorder}`}
    >
      <span className="font-medium text-text-main">{merchant}</span>
      {cheapest && (
        <span className="rounded-full bg-success px-2 py-0.5 text-[11px] text-white">ถูกสุด</span>
      )}
      {price != null && (
        <span className="ml-auto text-sm text-text-secondary">฿{price.toLocaleString()}</span>
      )}
      <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${pill}`}>สั่งซื้อ</span>
    </a>
  );
}
