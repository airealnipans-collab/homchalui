// apps/web/components/ListPageView.tsx
// Shared list-page layout for category/brand/scent (all locales). หอมฉลุย — Powered by 2T9COME.
// The page resolves the entity (notFound on missing translation) and passes a validated query +
// presentational bits; this view fetches the products, renders the rail/sort/grid/pagination,
// and emits ItemList + BreadcrumbList JSON-LD.
import type { Locale } from "@homchalui/i18n";
import { Breadcrumb, ProductGrid, FAQBlock, type Crumb, type FaqItem } from "@homchalui/ui";
import type { ProductListQuery } from "@homchalui/validators";
import { listProducts } from "@/lib/listing";
import { breadcrumbLd, itemListLd, ld, withPage } from "@/lib/list-page";
import { getSessionId } from "@/lib/session";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SortControl } from "@/components/SortControl";
import { Pagination } from "@/components/Pagination";

const COUNT: Record<Locale, (n: number) => string> = {
  th: (n) => `${n} รายการ`,
  en: (n) => `${n} items`,
  zh: (n) => `${n} 件`,
};

interface Props {
  locale: Locale;
  query: ProductListQuery;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  crumbs: Crumb[];
  title: string;
  intro?: string | null;
  listName: string;
  faqItems?: FaqItem[];
}

export async function ListPageView({ locale, query, basePath, searchParams, crumbs, title, intro, listName, faqItems }: Props) {
  const { items, meta } = await listProducts(query);
  const sessionId = getSessionId();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd(crumbs), itemListLd(items, locale, title)) }}
      />
      <Breadcrumb items={crumbs} locale={locale} />

      <header className="mt-3">
        <h1 className="text-2xl font-semibold text-brand-dark">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-sm text-text-secondary">{intro}</p>}
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <CategoryFilter locale={locale} />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">{COUNT[locale](meta.total)}</p>
            <SortControl value={query.sort} locale={locale} />
          </div>
          <ProductGrid items={items} locale={locale} listName={listName} sessionId={sessionId} />
          <Pagination
            page={meta.page}
            hasMore={meta.hasMore}
            hrefForPage={(p) => withPage(searchParams, basePath, p)}
            locale={locale}
          />
          {faqItems && faqItems.length > 0 && <FAQBlock items={faqItems} locale={locale} />}
        </div>
      </div>
    </main>
  );
}
