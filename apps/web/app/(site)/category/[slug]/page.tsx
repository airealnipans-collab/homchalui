// apps/web/app/(site)/category/[slug]/page.tsx — Thai category page. หอมฉลุย — Powered by 2T9COME.
// Thin wrapper over the shared ListPageView; /[locale]/category/[slug] mirrors it for en/zh.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { getCategoryBySlug, categoryMetadata } from "@/lib/categories";
import { resolveListQuery, HOME_LABEL } from "@/lib/list-page";
import { ListPageView } from "@/components/ListPageView";

const LOCALE = "th" as const;
type Props = { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryMetadata(params.slug, LOCALE);
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = await getCategoryBySlug(params.slug, LOCALE);
  if (!cat) notFound();
  const query = resolveListQuery(searchParams, { locale: LOCALE, category: cat.slug });
  return (
    <ListPageView
      locale={LOCALE}
      query={query}
      basePath={localizedPath(LOCALE, `/category/${cat.slug}`)}
      searchParams={searchParams}
      crumbs={[{ label: HOME_LABEL[LOCALE], href: localizedPath(LOCALE, "/") }, { label: cat.name }]}
      title={cat.name}
      intro={cat.aeoSummary ?? cat.description}
      listName={`category:${cat.slug}`}
    />
  );
}
