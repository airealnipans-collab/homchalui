// apps/web/app/[locale]/page.tsx — localized home (/en, /zh). หอมฉลุย — Powered by 2T9COME.
// Driven by the Layout Builder (HomeView). Published-only; emits canonical + hreflang.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { parsePrefixedLocale, homeAlternates } from "@/lib/locale";
import { buildMetadata } from "@/lib/seo/metadata";
import { HomeView } from "@/components/HomeView";

const SUBTITLE: Record<"en" | "zh", string> = {
  en: "Review, compare and pick the right scent — then buy from the store you prefer.",
  zh: "评测、对比并挑选适合你的香氛 — 然后在你喜欢的商店购买。",
};

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return buildMetadata({
    locale,
    title: locale === "zh" ? "Homchalui 香氛 — 香氛评测" : "Homchalui — Fragrance reviews",
    description: SUBTITLE[locale],
    canonicalPath: localizedPath(locale, "/"),
    alternates: homeAlternates(),
  });
}

export default function LocaleHome({ params }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  return <HomeView locale={locale} />;
}
