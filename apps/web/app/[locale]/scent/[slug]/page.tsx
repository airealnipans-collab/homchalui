// apps/web/app/[locale]/scent/[slug]/page.tsx — localized scent-family page (/en, /zh).
// หอมฉลุย — Powered by 2T9COME. Mirrors the Thai scent page via the shared ListPageView.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { getScentFamily, scentMetadata } from "@/lib/categories";
import { resolveListQuery, HOME_LABEL, SCENT_LABEL, SCENT_INTRO } from "@/lib/list-page";
import { parsePrefixedLocale } from "@/lib/locale";
import { ListPageView } from "@/components/ListPageView";

const SCENT_TITLE: Record<"en" | "zh", (name: string) => string> = {
  en: (n) => `${n} scents`,
  zh: (n) => `${n}香调`,
};

type Props = { params: { locale: string; slug: string }; searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ params }: Props): Promise<Metadata> | Metadata {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return scentMetadata(params.slug, locale);
}

export default async function LocaleScentPage({ params, searchParams }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  const scent = await getScentFamily(params.slug, locale);
  if (!scent) notFound();
  const query = resolveListQuery(searchParams, { locale, scent: scent.slug });
  return (
    <ListPageView
      locale={locale}
      query={query}
      basePath={localizedPath(locale, `/scent/${scent.slug}`)}
      searchParams={searchParams}
      crumbs={[
        { label: HOME_LABEL[locale], href: localizedPath(locale, "/") },
        { label: SCENT_LABEL[locale] },
        { label: scent.name },
      ]}
      title={SCENT_TITLE[locale](scent.name)}
      intro={SCENT_INTRO[locale](scent.name)}
      listName={`scent:${scent.slug}`}
    />
  );
}
