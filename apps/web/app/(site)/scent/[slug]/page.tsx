// apps/web/app/(site)/scent/[slug]/page.tsx — Thai scent-family page. หอมฉลุย — Powered by 2T9COME.
// Scoped to a scent family (e.g. woody, fresh). Scent families have no translation table, so the
// page resolves via products that use the family in `locale` (none → notFound). ItemList +
// BreadcrumbList JSON-LD.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath } from "@homchalui/i18n";
import { clientEnv } from "@homchalui/config/env";
import { Breadcrumb, ProductGrid } from "@homchalui/ui";
import { getScentFamily } from "@/lib/categories";
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
  const scent = await getScentFamily(params.slug, LOCALE);
  if (!scent) return { title: "ไม่พบกลิ่น | หอมฉลุย", robots: { index: false } };
  const canonical = `${SITE}/scent/${scent.slug}`;
  return {
    title: `${scent.name} | หอมฉลุย`,
    description: `รวมของหอมกลิ่น${scent.name} ที่รีวิวและเปรียบเทียบโดยหอมฉลุย`,
    alternates: { canonical },
  };
}

export default async function ScentPage({ params, searchParams }: Props) {
  const scent = await getScentFamily(params.slug, LOCALE);
  if (!scent) notFound();

  const query = resolveListQuery(searchParams, { locale: LOCALE, scent: scent.slug });
  const { items, meta } = await listProducts(query);
  const sessionId = getSessionId();
  const listName = `scent:${scent.slug}`;
  const basePath = localizedPath(LOCALE, `/scent/${scent.slug}`);

  const crumbs = [
    { label: "หน้าแรก", href: localizedPath(LOCALE, "/") },
    { label: "กลิ่น", href: undefined },
    { label: scent.name },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd(crumbs), itemListLd(items, LOCALE, scent.name)) }}
      />
      <Breadcrumb items={crumbs} locale={LOCALE} />

      <header className="mt-3">
        <h1 className="text-2xl font-semibold text-brand-dark">กลิ่น{scent.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          รวมของหอมในกลุ่มกลิ่น{scent.name} — เปรียบเทียบคะแนน ความติดทน และราคา แล้วเลือกซื้อผ่านร้านที่ต้องการ
        </p>
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
