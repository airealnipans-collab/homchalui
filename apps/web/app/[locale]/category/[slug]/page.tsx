// apps/web/app/[locale]/category/[slug]/page.tsx — localized category page (/en, /zh).
// หอมฉลุย — Powered by 2T9COME. Mirrors the Thai category page via the shared ListPageView.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { getCategoryBySlug, categoryMetadata } from "@/lib/categories";
import { resolveListQuery, HOME_LABEL } from "@/lib/list-page";
import { parsePrefixedLocale } from "@/lib/locale";
import { ListPageView } from "@/components/ListPageView";

type Props = { params: { locale: string; slug: string }; searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ params }: Props): Promise<Metadata> | Metadata {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return categoryMetadata(params.slug, locale);
}

export default async function LocaleCategoryPage({ params, searchParams }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  const cat = await getCategoryBySlug(params.slug, locale);
  if (!cat) notFound();
  const query = resolveListQuery(searchParams, { locale, category: cat.slug });
  return (
    <ListPageView
      locale={locale}
      query={query}
      basePath={localizedPath(locale, `/category/${cat.slug}`)}
      searchParams={searchParams}
      crumbs={[{ label: HOME_LABEL[locale], href: localizedPath(locale, "/") }, { label: cat.name }]}
      title={cat.name}
      intro={cat.aeoSummary ?? cat.description}
      listName={`category:${cat.slug}`}
    />
  );
}
