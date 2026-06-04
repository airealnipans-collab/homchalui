// apps/web/app/(site)/category/[slug]/page.tsx — Thai (default, no prefix) category page.
// หอมฉลุย — Powered by 2T9COME. Server Component: resolves the published category translation
// (no Thai fallback → notFound), SSR-renders the first page of /api/products results, emits
// ItemList + BreadcrumbList JSON-LD. Filters/sort are URL-synced client controls.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { clientEnv } from "@homchalui/config/env";
import { Breadcrumb, ProductGrid } from "@homchalui/ui";
import { getCategoryBySlug } from "@/lib/categories";
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
  const cat = await getCategoryBySlug(params.slug, LOCALE);
  if (!cat) return { title: "ไม่พบหมวดหมู่ | หอมฉลุย", robots: { index: false } };
  const canonical = `${SITE}/category/${cat.slug}`;
  return {
    title: cat.seoTitle ?? `${cat.name} | หอมฉลุย`,
    description: cat.seoDescription ?? cat.description ?? undefined,
    alternates: { canonical },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = await getCategoryBySlug(params.slug, LOCALE);
  if (!cat) notFound(); // no fallback — unpublished/missing translation ⇒ 404

  const query = resolveListQuery(searchParams, { locale: LOCALE, category: cat.slug });
  const { items, meta } = await listProducts(query);
  const sessionId = getSessionId();
  const listName = `category:${cat.slug}`;
  const basePath = localizedPath(LOCALE, `/category/${cat.slug}`);

  const crumbs = [{ label: "หน้าแรก", href: localizedPath(LOCALE, "/") }, { label: cat.name }];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd(crumbs), itemListLd(items, LOCALE, cat.name)) }}
      />
      <Breadcrumb items={crumbs} locale={LOCALE} />

      <header className="mt-3">
        <h1 className="text-2xl font-semibold text-brand-dark">{cat.name}</h1>
        {(cat.aeoSummary || cat.description) && (
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">{cat.aeoSummary ?? cat.description}</p>
        )}
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
