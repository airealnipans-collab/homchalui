// apps/web/lib/search.ts
// On-site product search (Phase 1: Postgres ILIKE; Meilisearch in a later WP). Powered by 2T9COME.
// Published-translation-only + locale (no Thai fallback). Records search_query_stats (incl. the
// zero_result flag) on every query so the backoffice can mine demand + gaps.
import { db, Prisma } from "@homchalui/db";
import { withCache, dateKey } from "@homchalui/redis";
import { type SearchQuery, type SearchResult } from "@homchalui/validators";
import type { Locale } from "@homchalui/i18n";
import { buildProductWhere, cardSelect, orderBy, badgeSignals, hydrate, stableHash, type CardRow } from "./listing";

const SEARCH_CACHE_TTL = 60; // seconds

/** Text predicate across the localized name/descriptions + the localized brand name. */
function textWhere(q: string, locale: Locale): Prisma.ProductTranslationWhereInput {
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { name: contains },
      { shortDescription: contains },
      { fullDescription: contains },
      { product: { brand: { translations: { some: { locale, name: contains } } } } },
    ],
  };
}

async function runSearch(q: SearchQuery): Promise<SearchResult> {
  const locale = q.locale as Locale;
  const select = cardSelect(locale);
  const where: Prisma.ProductTranslationWhereInput = {
    locale,
    translationStatus: "published",
    product: buildProductWhere(q, locale),
    AND: [textWhere(q.q, locale)],
  };
  const skip = (q.page - 1) * q.limit;
  const signals = await badgeSignals(locale);

  const [total, rows] = await Promise.all([
    db.productTranslation.count({ where }),
    db.productTranslation.findMany({ where, orderBy: orderBy(q.sort), skip, take: q.limit, select }),
  ]);
  const items = await hydrate(rows as CardRow[], locale, signals);
  return {
    items,
    meta: { total, page: q.page, limit: q.limit, hasMore: skip + rows.length < total },
    zeroResult: total === 0,
  };
}

/** Upsert today's stat row for this (locale, query). Best-effort — never fails the request. */
async function recordStat(locale: Locale, query: string, total: number): Promise<void> {
  const date = new Date(dateKey()); // UTC midnight; matches @db.Date granularity
  try {
    await db.searchQueryStat.upsert({
      where: { locale_query_date: { locale, query, date } },
      create: { locale, query, date, count: 1, resultsCount: total, zeroResult: total === 0 },
      update: { count: { increment: 1 }, resultsCount: total, zeroResult: total === 0 },
    });
  } catch (e) {
    console.error("[search] failed to record search_query_stats", e);
  }
}

/** Public entry: cached results + always-recorded query stats. */
export async function searchProducts(q: SearchQuery): Promise<SearchResult> {
  const result = await withCache(
    `cache:search:${q.locale}:${stableHash(q)}`,
    SEARCH_CACHE_TTL,
    () => runSearch(q),
    [`search:${q.locale}`],
  );
  // Record the query every call (even on a cache hit) so demand counts stay accurate.
  await recordStat(q.locale as Locale, q.q, result.meta.total);
  return result;
}
