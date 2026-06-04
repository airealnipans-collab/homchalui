// apps/web/app/[locale]/brand/[slug]/page.tsx — localized brand page (/en, /zh).
// หอมฉลุย — Powered by 2T9COME. Mirrors the Thai brand page via the shared ListPageView.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { getBrandBySlug, brandMetadata } from "@/lib/categories";
import { resolveListQuery, HOME_LABEL, BRAND_LABEL } from "@/lib/list-page";
import { parsePrefixedLocale } from "@/lib/locale";
import { ListPageView } from "@/components/ListPageView";

type Props = { params: { locale: string; slug: string }; searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ params }: Props): Promise<Metadata> | Metadata {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return brandMetadata(params.slug, locale);
}

export default async function LocaleBrandPage({ params, searchParams }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  const brand = await getBrandBySlug(params.slug, locale);
  if (!brand) notFound();
  const query = resolveListQuery(searchParams, { locale, brand: brand.slug });
  return (
    <ListPageView
      locale={locale}
      query={query}
      basePath={localizedPath(locale, `/brand/${brand.slug}`)}
      searchParams={searchParams}
      crumbs={[
        { label: HOME_LABEL[locale], href: localizedPath(locale, "/") },
        { label: BRAND_LABEL[locale] },
        { label: brand.name },
      ]}
      title={brand.name}
      intro={brand.description}
      listName={`brand:${brand.slug}`}
    />
  );
}
