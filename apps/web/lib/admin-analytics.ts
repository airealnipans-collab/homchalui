// apps/web/lib/admin-analytics.ts
// Backoffice analytics aggregation. หอมฉลุย — Powered by 2T9COME.
// Reads tracking_events (first-party, incl. server-recorded outbound) + search_query_stats.
// Sliceable by date range. (Hourly/daily rollups feed deeper reports later.)
import { db, Prisma } from "@homchalui/db";

export interface Analytics {
  totals: { views: number; outbound: number; searches: number };
  topProducts: { productId: string; name: string; outbound: number }[];
  topMerchants: { merchantId: string; name: string; outbound: number }[];
  searches: { query: string; locale: string; count: number; zeroResult: boolean }[];
}

function range(from?: Date, to?: Date): Prisma.TrackingEventWhereInput {
  if (!from && !to) return {};
  return { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } };
}

export async function getAnalytics(from?: Date, to?: Date): Promise<Analytics> {
  const r = range(from, to);

  const [views, outbound, topProd, topMerch, searchStats] = await Promise.all([
    db.trackingEvent.count({ where: { ...r, event: "view_item" } }),
    db.trackingEvent.count({ where: { ...r, event: "affiliate_outbound_click" } }),
    db.trackingEvent.groupBy({
      by: ["productId"],
      where: { ...r, event: "affiliate_outbound_click", productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    db.trackingEvent.groupBy({
      by: ["merchantId"],
      where: { ...r, event: "affiliate_outbound_click", merchantId: { not: null } },
      _count: { merchantId: true },
      orderBy: { _count: { merchantId: "desc" } },
      take: 10,
    }),
    db.searchQueryStat.findMany({ orderBy: { count: "desc" }, take: 20, select: { query: true, locale: true, count: true, zeroResult: true } }),
  ]);

  const prodIds = topProd.map((p) => p.productId).filter((x): x is string => !!x);
  const merchIds = topMerch.map((m) => m.merchantId).filter((x): x is string => !!x);
  const [prodNames, merchants] = await Promise.all([
    db.productTranslation.findMany({ where: { productId: { in: prodIds }, locale: "th" }, select: { productId: true, name: true } }),
    db.merchant.findMany({ where: { id: { in: merchIds } }, select: { id: true, name: true } }),
  ]);
  const nameOf = new Map(prodNames.map((p) => [p.productId, p.name]));
  const merchOf = new Map(merchants.map((m) => [m.id, m.name]));

  return {
    totals: { views, outbound, searches: searchStats.reduce((a, s) => a + s.count, 0) },
    topProducts: topProd.map((p) => ({ productId: p.productId!, name: nameOf.get(p.productId!) ?? p.productId!, outbound: p._count.productId })),
    topMerchants: topMerch.map((m) => ({ merchantId: m.merchantId!, name: merchOf.get(m.merchantId!) ?? m.merchantId!, outbound: m._count.merchantId })),
    searches: searchStats,
  };
}
