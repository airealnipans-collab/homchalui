// apps/web/components/Footer.tsx
// Global footer — MUST render "Powered by 2T9COME" on every page (permanent requirement).
// Shows the brand wordmark (icon + หอมฉลุย) + affiliate disclosure. Server component.
// หอมฉลุย — Powered by 2T9COME.
import type { Locale } from "@homchalui/i18n";

const DISCLOSURE: Record<Locale, string> = {
  th: "หอมฉลุยอาจได้รับค่าคอมมิชชั่นเมื่อคุณซื้อผ่านลิงก์ของเรา โดยไม่มีค่าใช้จ่ายเพิ่มสำหรับคุณ",
  en: "Homchalui may earn a commission when you buy through our links, at no extra cost to you.",
  zh: "通过我们的链接购买时，หอมฉลุย（Homchalui）可能获得佣金，您无需支付额外费用。",
};

export function Footer({ locale = "th" as Locale }: { locale?: Locale }) {
  return (
    <footer className="mt-16 border-t border-line bg-bg-soft text-text-main">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
        <div className="mb-3 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/production_logo/logo-icon.png" alt="" height={28} style={{ height: 28 }} />
          <span className="text-lg font-medium text-brand-dark">หอมฉลุย</span>
        </div>
        <p className="mb-4 max-w-xl text-xs text-text-muted">{DISCLOSURE[locale]}</p>
        {/* Permanent brand credit — do not remove. */}
        <p className="font-medium tracking-wide text-brand-dark">Powered by 2T9COME</p>
      </div>
    </footer>
  );
}
