// apps/web/app/[locale]/page.tsx — localized home (/en, /zh). หอมฉลุย — Powered by 2T9COME.
// Published-translation-only (no Thai fallback): an en/zh home simply shows fewer items if little
// is translated. Emits canonical + hreflang for the home across locales.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { ProductGrid } from "@homchalui/ui";
import { parsePrefixedLocale, homeAlternates, metadataAlternates } from "@/lib/locale";
import { resolveListQuery } from "@/lib/list-page";
import { listProducts } from "@/lib/listing";
import { getSessionId } from "@/lib/session";

const HERO: Record<"en" | "zh", { title: string; subtitle: string; latest: string }> = {
  en: {
    title: "Homchalui",
    subtitle: "Review, compare and pick the right scent — then buy from the store you prefer.",
    latest: "Latest reviews",
  },
  zh: {
    title: "Homchalui 香氛",
    subtitle: "评测、对比并挑选适合你的香氛 — 然后在你喜欢的商店购买。",
    latest: "最新评测",
  },
};

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  const { canonical, languages } = metadataAlternates(localizedPath(locale, "/"), homeAlternates());
  return {
    title: locale === "zh" ? "Homchalui 香氛 — 香氛评测" : "Homchalui — Fragrance reviews",
    description: HERO[locale].subtitle,
    alternates: { canonical, languages },
  };
}

export default async function LocaleHome({ params }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  const hero = HERO[locale];

  const query = resolveListQuery({}, { locale });
  const { items } = await listProducts({ ...query, limit: 12 });
  const sessionId = getSessionId();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-3xl bg-lavender/40 p-8">
        <h1 className="text-3xl font-semibold text-brand-dark">{hero.title}</h1>
        <p className="mt-2 text-text-secondary">{hero.subtitle}</p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-brand-dark">{hero.latest}</h2>
        <ProductGrid items={items} locale={locale} listName="home:latest" sessionId={sessionId} />
      </section>
    </main>
  );
}
