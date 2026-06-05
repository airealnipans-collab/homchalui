// apps/web/components/LayoutSectionRenderer.tsx
// Renders Layout Builder sections. หอมฉลุย — Powered by 2T9COME.
// Server component: resolves each section's data (published-only + locale), renders the matching
// block, and HIDES a section whose data source is empty (COMPONENT_LIBRARY). custom_html sanitized.
import Link from "next/link";
import { db } from "@homchalui/db";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { ProductGrid } from "@homchalui/ui";
import { productListShape, parseSectionConfig, type SectionType, type ProductCardVM } from "@homchalui/validators";
import { listProducts, cardSelect, hydrate, badgeSignals, type CardRow } from "@/lib/listing";
import { sanitize, type RawSection } from "@/lib/layout";

const SORT_BY_SOURCE: Record<string, "trending" | "most_clicked" | "recommended"> = {
  trending: "trending", most_clicked: "most_clicked", latest: "recommended", category: "recommended", best: "recommended",
};

async function productsByIds(ids: string[], locale: Locale, take: number): Promise<ProductCardVM[]> {
  const signals = await badgeSignals(locale);
  const rows = await db.productTranslation.findMany({
    where: { locale, translationStatus: "published", productId: { in: ids }, product: { status: "published" } },
    select: cardSelect(locale),
  });
  const items = await hydrate(rows as CardRow[], locale, signals);
  const byId = new Map(items.map((i) => [i.id, i]));
  return ids.map((id) => byId.get(id)).filter((x): x is ProductCardVM => !!x).slice(0, take);
}

async function productsByCampaign(tag: string, locale: Locale, take: number): Promise<ProductCardVM[]> {
  const signals = await badgeSignals(locale);
  const rows = await db.productTranslation.findMany({
    where: { locale, translationStatus: "published", product: { status: "published", campaignTag: tag } },
    orderBy: [{ product: { manualPin: "desc" } }, { product: { scores: { overallCached: "desc" } } }],
    take,
    select: cardSelect(locale),
  });
  return hydrate(rows as CardRow[], locale, signals);
}

async function sectionProducts(type: SectionType, cfg: Record<string, unknown>, locale: Locale): Promise<ProductCardVM[]> {
  const take = Number(cfg.limit ?? 12);
  if (type === "editorial_picks" && Array.isArray(cfg.productIds) && cfg.productIds.length) {
    return productsByIds(cfg.productIds as string[], locale, take);
  }
  if (typeof cfg.campaignTag === "string" && cfg.campaignTag) return productsByCampaign(cfg.campaignTag, locale, take);
  const sort = type === "trending_list" ? "trending" : SORT_BY_SOURCE[String(cfg.source ?? "latest")] ?? "recommended";
  const q = productListShape.parse({ locale, sort, category: cfg.category, limit: take });
  return (await listProducts(q)).items;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-semibold text-brand-dark">{children}</h2>;
}

async function renderSection(s: RawSection, locale: Locale, sessionId?: string) {
  const type = s.type as SectionType;
  const cfg = parseSectionConfig(type, s.config);
  if (!cfg) return null; // invalid config → skip safely

  switch (type) {
    case "hero":
      return (
        <section key={s.id} className="rounded-3xl bg-lavender/40 p-8">
          <h1 className="text-3xl font-semibold text-brand-dark">{String(cfg.title)}</h1>
          {cfg.subtitle ? <p className="mt-2 text-text-secondary">{String(cfg.subtitle)}</p> : null}
          {cfg.ctaLabel && cfg.ctaHref ? (
            <Link href={localizedPath(locale, String(cfg.ctaHref))} className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-medium text-white">
              {String(cfg.ctaLabel)}
            </Link>
          ) : null}
        </section>
      );

    case "product_carousel":
    case "trending_list":
    case "editorial_picks": {
      const items = await sectionProducts(type, cfg, locale);
      if (items.length === 0) return null;
      return (
        <section key={s.id}>
          {cfg.title ? <Heading>{String(cfg.title)}</Heading> : null}
          <ProductGrid items={items} locale={locale} listName={`layout:${type}`} sessionId={sessionId} />
        </section>
      );
    }

    case "category_grid": {
      const take = Number(cfg.limit ?? 12);
      const rows = await db.categoryTranslation.findMany({
        where: { locale },
        take,
        orderBy: { category: { sortOrder: "asc" } },
        select: { name: true, slug: true, category: { select: { icon: true } } },
      });
      if (rows.length === 0) return null;
      return (
        <section key={s.id}>
          {cfg.title ? <Heading>{String(cfg.title)}</Heading> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {rows.map((c) => (
              <Link key={c.slug} href={localizedPath(locale, `/category/${c.slug}`)} className="rounded-2xl border border-line bg-card p-4 text-center text-sm hover:border-brand">
                {c.category.icon ? <span className={`ti ${c.category.icon} mb-1 block text-2xl text-brand`} aria-hidden="true" /> : null}
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "article_block": {
      const take = Number(cfg.limit ?? 6);
      const kind = (cfg.kind === "guide" ? "guide" : "article") as "guide" | "article";
      const rows = await db.articleTranslation.findMany({
        where: { locale, status: "published", article: { status: "published", kind } },
        take,
        orderBy: { article: { createdAt: "desc" } },
        select: { title: true, slug: true, excerpt: true, article: { select: { coverImageUrl: true } } },
      });
      if (rows.length === 0) return null;
      return (
        <section key={s.id}>
          {cfg.title ? <Heading>{String(cfg.title)}</Heading> : null}
          <div className="grid gap-4 md:grid-cols-3">
            {rows.map((a) => (
              <Link key={a.slug} href={localizedPath(locale, `/${kind}/${a.slug}`)} className="rounded-2xl border border-line bg-card p-4 hover:shadow-md">
                <p className="font-medium text-text-main">{a.title}</p>
                {a.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-text-muted">{a.excerpt}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case "custom_html": {
      const html = sanitize(String(cfg.html ?? ""));
      if (!html.trim()) return null;
      return <section key={s.id} dangerouslySetInnerHTML={{ __html: html }} />;
    }

    default:
      return null;
  }
}

export async function LayoutSectionRenderer({
  sections,
  locale,
  sessionId,
}: {
  sections: RawSection[];
  locale: Locale;
  sessionId?: string;
}) {
  const rendered = await Promise.all(sections.map((s) => renderSection(s, locale, sessionId)));
  return <div className="space-y-12">{rendered}</div>;
}
