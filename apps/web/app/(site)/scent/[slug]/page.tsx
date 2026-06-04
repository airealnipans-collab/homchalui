// apps/web/app/(site)/scent/[slug]/page.tsx — Thai scent-family page. หอมฉลุย — Powered by 2T9COME.
// Thin wrapper over ListPageView; /[locale]/scent/[slug] mirrors it for en/zh.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { getScentFamily, scentMetadata } from "@/lib/categories";
import { resolveListQuery, HOME_LABEL, SCENT_LABEL, SCENT_INTRO } from "@/lib/list-page";
import { ListPageView } from "@/components/ListPageView";

const LOCALE = "th" as const;
type Props = { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return scentMetadata(params.slug, LOCALE);
}

export default async function ScentPage({ params, searchParams }: Props) {
  const scent = await getScentFamily(params.slug, LOCALE);
  if (!scent) notFound();
  const query = resolveListQuery(searchParams, { locale: LOCALE, scent: scent.slug });
  return (
    <ListPageView
      locale={LOCALE}
      query={query}
      basePath={localizedPath(LOCALE, `/scent/${scent.slug}`)}
      searchParams={searchParams}
      crumbs={[
        { label: HOME_LABEL[LOCALE], href: localizedPath(LOCALE, "/") },
        { label: SCENT_LABEL[LOCALE] },
        { label: scent.name },
      ]}
      title={`กลิ่น${scent.name}`}
      intro={SCENT_INTRO[LOCALE](scent.name)}
      listName={`scent:${scent.slug}`}
    />
  );
}
