// apps/web/app/[locale]/layout.tsx — /en and /zh group shell. หอมฉลุย — Powered by 2T9COME.
// Validates the prefix (only en|zh; /th never exists → middleware redirects it to /). Renders the
// locale-aware SiteHeader + Footer so the brand chrome + "Powered by 2T9COME" appear on every
// localized page. <html lang> is set by the root layout from the x-locale header.
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { parsePrefixedLocale } from "@/lib/locale";

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound(); // unknown prefix (e.g. /th, /fr) ⇒ 404

  return (
    <>
      <PageViewTracker locale={locale} />
      <SiteHeader locale={locale} />
      {children}
      <Footer locale={locale} />
    </>
  );
}
