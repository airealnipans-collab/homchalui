"use client";
// apps/web/components/ProductActionBar.tsx
// Sticky bottom bar on the product page: รีวิว · เทียบ · สั่งซื้อ. หอมฉลุย — Powered by 2T9COME.
// "สั่งซื้อ" scrolls to the merchant list (#merchants) which uses MerchantButton (tracked
// outbound). It never links to a raw affiliate URL. "เทียบ" adds to the compare tray.
import type { Locale } from "@homchalui/i18n";

interface Props {
  locale: Locale;
  reviewCount: number;
  merchantCount: number;
  /** Optional handler to add this product to the compare tray. */
  onCompare?: () => void;
  productId: string;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function ProductActionBar({ reviewCount, merchantCount, onCompare }: Props) {
  return (
    <div className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-line bg-card px-3 py-2.5">
      <button
        type="button"
        onClick={() => scrollTo("reviews")}
        className="flex flex-col items-center gap-0.5 px-1 text-[10px] text-brand-dark"
        aria-label={`ดูรีวิว ${reviewCount} รายการ`}
      >
        <span className="ti ti-message-circle text-[19px]" aria-hidden="true" />
        รีวิว
      </button>
      <button
        type="button"
        onClick={onCompare}
        className="flex flex-col items-center gap-0.5 px-1 text-[10px] text-brand-dark"
      >
        <span className="ti ti-git-compare text-[19px]" aria-hidden="true" />
        เทียบ
      </button>
      <button
        type="button"
        onClick={() => scrollTo("merchants")}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-3 text-[15px] font-medium text-white"
      >
        <span className="ti ti-shopping-bag text-[18px]" aria-hidden="true" />
        สั่งซื้อ{merchantCount ? ` (${merchantCount} ร้าน)` : ""}
      </button>
    </div>
  );
}
