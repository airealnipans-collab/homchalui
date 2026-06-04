// apps/web/app/not-found.tsx — global localized 404. หอมฉลุย — Powered by 2T9COME.
// The root layout does NOT render the header/footer (those live in the route-group layouts),
// so this page renders them itself to keep the brand chrome — and the permanent
// "Powered by 2T9COME" credit — present on the 404. Locale comes from the x-locale header set
// by middleware. No Thai fallback in copy: each locale has its own strings.
import Link from "next/link";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { DEFAULT_LOCALE, isLocale, localizedPath, type Locale } from "@homchalui/i18n";

const COPY: Record<Locale, { title: string; body: string; home: string }> = {
  th: {
    title: "ไม่พบหน้าที่คุณกำลังหา",
    body: "หน้านี้อาจถูกย้ายหรือลบไปแล้ว ลองกลับไปที่หน้าแรกเพื่อค้นหาของหอมที่ใช่",
    home: "กลับหน้าแรก",
  },
  en: {
    title: "We couldn't find that page",
    body: "The page may have moved or been removed. Head back home to keep exploring scents.",
    home: "Back to home",
  },
  zh: {
    title: "找不到该页面",
    body: "该页面可能已移动或被删除。返回首页继续探索香氛。",
    home: "返回首页",
  },
};

export default function NotFound() {
  const headerLocale = headers().get("x-locale") ?? DEFAULT_LOCALE;
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const copy = COPY[locale];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
        <p className="text-6xl font-semibold text-brand">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-brand-dark">{copy.title}</h1>
        <p className="mt-3 max-w-md text-sm text-text-secondary">{copy.body}</p>
        <Link
          href={localizedPath(locale, "/")}
          className="mt-8 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {copy.home}
        </Link>
      </main>
      <Footer locale={locale} />
    </>
  );
}
