// apps/web/lib/listing.ts
// Product listing service — published-translation-only, locale-aware, cached. Powered by 2T9COME.
// NO Thai fallback: only products with a PUBLISHED translation in `locale` are returned.
// Sorting: `trending`/`most_clicked` read the Redis ranking sorted set (rank:{key}:{locale})
// written by the worker, then hydrate from the DB; all other sorts query the DB with indexes.
import { db, Prisma } from "@homchalui/db";
import { redisRead, KEY, withCache } from "@homchalui/redis";
import { REDIS_SORTS, type ProductListQuery, type ProductCardVM, type ProductListResult, type BadgeKind } from "@homchalui/validators";
import type { Locale } from "@homchalui/i18n";

// Score threshold above which a product earns the corresponding data-derived badge.
const BADGE_THRESHOLD = 8;
const LIST_CACHE_TTL = 60; // seconds

/** Card select, parameterized so brand translations are filtered to the requested locale. */
export function cardSelect(locale: Locale) {
  return {
    name: true,
    slug: true,
    product: {
      select: {
        id: true,
        priceMin: true,
        priceMax: true,
        currency: true,
        mainImageUrl: true,
        brand: { select: { translations: { where: { locale }, select: { name: true, slug: true } } } },
        scores: { select: { longevity: true, value: true, luxury: true, beginnerFriendly: true, overallCached: true } },
        scentProfile: { select: { mood: true, occasion: true } },
      },
    },
  } satisfies Prisma.ProductTranslationSelect;
}

type CardRow = Prisma.ProductTranslationGetPayload<{ select: ReturnType<typeof cardSelect> }>;

export type { CardRow };

/** Build the Product-level WHERE from validated filters. Published-only is always enforced. */
export function buildProductWhere(q: ProductListQuery, locale: Locale): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "published" }];

  if (q.category) {
    and.push({
      OR: [
        { primaryCategory: { translations: { some: { locale, slug: q.category } } } },
        { categories: { some: { category: { translations: { some: { locale, slug: q.category } } } } } },
      ],
    });
  }
  if (q.brand) and.push({ brand: { translations: { some: { locale, slug: q.brand } } } });
  if (q.scent) and.push({ scentProfile: { scentFamily: q.scent } });
  // Price uses priceMin as the representative price (Phase 1). minPrice ≤ maxPrice validated upstream.
  if (q.minPrice != null) and.push({ priceMin: { gte: q.minPrice } });
  if (q.maxPrice != null) and.push({ priceMin: { lte: q.maxPrice } });
  if (q.gender) and.push({ scentProfile: { genderTarget: q.gender } });
  if (q.mood) and.push({ scentProfile: { mood: { has: q.mood } } });
  if (q.season) and.push({ scentProfile: { season: { has: q.season } } });
  if (q.occasion) and.push({ scentProfile: { occasion: { has: q.occasion } } });
  if (q.longevity != null) and.push({ scores: { longevity: { gte: q.longevity } } });
  if (q.projection != null) and.push({ scores: { projection: { gte: q.projection } } });
  if (q.value != null) and.push({ scores: { value: { gte: q.value } } });
  if (q.merchant) and.push({ merchantLinks: { some: { status: "active", merchant: { key: q.merchant } } } });

  return { AND: and };
}

/** DB ordering for non-Redis sorts (trending/most_clicked fall back here too). */
export function orderBy(sort: ProductListQuery["sort"]): Prisma.ProductTranslationOrderByWithRelationInput | Prisma.ProductTranslationOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return { product: { priceMin: "asc" } };
    case "price_desc":
      return { product: { priceMin: "desc" } };
    case "longevity":
      return { product: { scores: { longevity: "desc" } } };
    case "beginner":
      return { product: { scores: { beginnerFriendly: "desc" } } };
    case "best_reviewed":
      // Proxy: cached overall score until a precomputed review aggregate lands (later WP).
      return { product: { scores: { overallCached: "desc" } } };
    default: // recommended
      return [
        { product: { manualPin: "desc" } },
        { product: { manualBoost: "desc" } },
        { product: { scores: { overallCached: "desc" } } },
        { product: { createdAt: "desc" } },
      ];
  }
}

/** Read an ordered list of product ids from a Redis ranking sorted set (highest score first). */
async function rankedIds(rankKey: "trending" | "best_click", locale: Locale): Promise<string[]> {
  try {
    return await redisRead().zrevrange(KEY.rank(rankKey, locale), 0, 499);
  } catch {
    return []; // fail-open: caller falls back to a DB sort
  }
}

/** Average published-review rating per product (separate query keeps the card select lean). */
async function ratingsFor(productIds: string[], locale: Locale): Promise<Map<string, { value: number; count: number }>> {
  if (productIds.length === 0) return new Map();
  const grouped = await db.productReview.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, locale, publishedAt: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const map = new Map<string, { value: number; count: number }>();
  for (const g of grouped) {
    if (g._count.rating > 0 && g._avg.rating != null) {
      map.set(g.productId, { value: Number(g._avg.rating.toFixed(1)), count: g._count.rating });
    }
  }
  return map;
}

/** Map a translation row to a ProductCard view-model. */
function toCardVM(
  row: CardRow,
  rating: { value: number; count: number } | null,
  trending: Set<string>,
  bestClick: Set<string>,
): ProductCardVM {
  const p = row.product;
  const s = p.scores;
  const badges: BadgeKind[] = [];
  if (trending.has(p.id)) badges.push("trending");
  if (bestClick.has(p.id)) badges.push("best_seller");
  if (s && s.value >= BADGE_THRESHOLD) badges.push("best_value");
  if (s && s.luxury >= BADGE_THRESHOLD) badges.push("luxury");
  if (s && s.longevity >= BADGE_THRESHOLD) badges.push("long_lasting");

  const moodOrOccasion = p.scentProfile?.mood?.[0] ?? p.scentProfile?.occasion?.[0];
  return {
    id: p.id,
    slug: row.slug,
    name: row.name,
    brand: { name: p.brand.translations[0]?.name ?? "", slug: p.brand.translations[0]?.slug ?? "" },
    image: p.mainImageUrl,
    priceMin: p.priceMin ? Number(p.priceMin) : null,
    priceMax: p.priceMax ? Number(p.priceMax) : null,
    currency: p.currency,
    rating,
    badges,
    longevity: s ? s.longevity : undefined,
    moodOrOccasion: moodOrOccasion ?? undefined,
  };
}

/** Top-N ranking sets used to mark trending/best_seller badges on any sort. */
export async function badgeSignals(locale: Locale): Promise<{ trending: Set<string>; bestClick: Set<string> }> {
  const [trending, bestClick] = await Promise.all([rankedIds("trending", locale), rankedIds("best_click", locale)]);
  return { trending: new Set(trending.slice(0, 50)), bestClick: new Set(bestClick.slice(0, 50)) };
}

export async function hydrate(
  rows: CardRow[],
  locale: Locale,
  signals: { trending: Set<string>; bestClick: Set<string> },
): Promise<ProductCardVM[]> {
  const ratings = await ratingsFor(rows.map((r) => r.product.id), locale);
  return rows.map((r) => toCardVM(r, ratings.get(r.product.id) ?? null, signals.trending, signals.bestClick));
}

/** Core listing. Used by /api/products and (with a brand/scent/category-scoped query) page SSR. */
export async function listProducts(q: ProductListQuery): Promise<ProductListResult> {
  return withCache(
    `cache:products:${q.locale}:${stableHash(q)}`,
    LIST_CACHE_TTL,
    () => runListing(q),
    [`products:${q.locale}`],
  );
}

async function runListing(q: ProductListQuery): Promise<ProductListResult> {
  const locale = q.locale as Locale;
  const select = cardSelect(locale);
  const where: Prisma.ProductTranslationWhereInput = {
    locale,
    translationStatus: "published",
    product: buildProductWhere(q, locale),
  };
  const signals = await badgeSignals(locale);
  const skip = (q.page - 1) * q.limit;

  const redisKey = REDIS_SORTS[q.sort];
  if (redisKey) {
    const ids = await rankedIds(redisKey, locale);
    if (ids.length > 0) {
      // Hydrate only products that are still published + match the filters, preserving rank order.
      const rows = await db.productTranslation.findMany({ where: { ...where, productId: { in: ids } }, select });
      const byId = new Map(rows.map((r) => [r.product.id, r]));
      const ordered = ids.map((id) => byId.get(id)).filter((r): r is CardRow => r != null);
      const total = ordered.length;
      const pageRows = ordered.slice(skip, skip + q.limit);
      const items = await hydrate(pageRows, locale, signals);
      return { items, meta: { total, page: q.page, limit: q.limit, hasMore: skip + q.limit < total } };
    }
    // Ranking set empty (e.g. worker hasn't run) → fall through to the DB recommended order.
  }

  const [total, rows] = await Promise.all([
    db.productTranslation.count({ where }),
    db.productTranslation.findMany({ where, orderBy: orderBy(q.sort), skip, take: q.limit, select }),
  ]);
  const items = await hydrate(rows, locale, signals);
  return { items, meta: { total, page: q.page, limit: q.limit, hasMore: skip + rows.length < total } };
}

/** Deterministic cache-key fragment for a query (stable key order). */
export function stableHash(q: Record<string, unknown>): string {
  const entries = Object.entries(q)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("&") || "all";
}
