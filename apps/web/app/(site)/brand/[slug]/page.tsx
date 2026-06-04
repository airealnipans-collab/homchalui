// apps/web/app/(site)/brand/[slug]/page.tsx — Thai brand page. หอมฉลุย — Powered by 2T9COME.
// Brand header + product grid scoped to the brand (filter/sort like category). Published brand
// translation only (no Thai fallback → notFound). ItemList + BreadcrumbList JSON-LD.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { clientEnv } from "@homchalui/config/env";
import { Breadcrumb, ProductGrid } from "@homchalui/ui";
import { getBrandBySlug } from "@/lib/categories";
import { listProducts } from "@/lib/listing";
import { resolveListQuery, breadcrumbLd, itemListLd, ld, withPage } from "@/lib/list-page";
import { getSessionId } from "@/lib/session";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SortControl } from "@/components/SortControl";
import { Pagination } from "@/components/Pagination";

const LOCALE = "th" as const;
const SITE = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

type Props = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await getBrandBySlug(params.slug, LOCALE);
  if (!brand) return { title: "ไม่พบแบรนด์ | หอมฉลุย", robots: { index: false } };
  const canonical = `${SITE}/brand/${brand.slug}`;
  return {
    title: brand.seoTitle ?? `${brand.name} | หอมฉลุย`,
    description: brand.seoDescription ?? brand.description ?? undefined,
    alternates: { canonical },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = await getBrandBySlug(params.slug, LOCALE);
  if (!brand) notFound();

  const query = resolveListQuery(searchParams, { locale: LOCALE, brand: brand.slug });
  const { items, meta } = await listProducts(query);
  const sessionId = getSessionId();
  const listName = `brand:${brand.slug}`;
  const basePath = localizedPath(LOCALE, `/brand/${brand.slug}`);

  const crumbs = [
    { label: "หน้าแรก", href: localizedPath(LOCALE, "/") },
    { label: "แบรนด์", href: undefined },
    { label: brand.name },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd(crumbs), itemListLd(items, LOCALE, brand.name)) }}
      />
      <Breadcrumb items={crumbs} locale={LOCALE} />

      <header className="mt-3">
        <h1 className="text-2xl font-semibold text-brand-dark">{brand.name}</h1>
        {brand.description && <p className="mt-2 max-w-2xl text-sm text-text-secondary">{brand.description}</p>}
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <CategoryFilter locale={LOCALE} />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">{meta.total} รายการ</p>
            <SortControl value={query.sort} locale={LOCALE} />
          </div>
          <ProductGrid items={items} locale={LOCALE} listName={listName} sessionId={sessionId} />
          <Pagination
            page={meta.page}
            hasMore={meta.hasMore}
            hrefForPage={(p) => withPage(searchParams, basePath, p)}
            locale={LOCALE}
          />
        </div>
      </div>
    </main>
  );
}
