// apps/web/app/(site)/brand/[slug]/page.tsx — Thai brand page. หอมฉลุย — Powered by 2T9COME.
// Thin wrapper over ListPageView; /[locale]/brand/[slug] mirrors it for en/zh.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { getBrandBySlug, brandMetadata } from "@/lib/categories";
import { resolveListQuery, HOME_LABEL, BRAND_LABEL } from "@/lib/list-page";
import { ListPageView } from "@/components/ListPageView";

const LOCALE = "th" as const;
type Props = { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return brandMetadata(params.slug, LOCALE);
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = await getBrandBySlug(params.slug, LOCALE);
  if (!brand) notFound();
  const query = resolveListQuery(searchParams, { locale: LOCALE, brand: brand.slug });
  return (
    <ListPageView
      locale={LOCALE}
      query={query}
      basePath={localizedPath(LOCALE, `/brand/${brand.slug}`)}
      searchParams={searchParams}
      crumbs={[
        { label: HOME_LABEL[LOCALE], href: localizedPath(LOCALE, "/") },
        { label: BRAND_LABEL[LOCALE] },
        { label: brand.name },
      ]}
      title={brand.name}
      intro={brand.description}
      listName={`brand:${brand.slug}`}
    />
  );
}
