// apps/worker/src/jobs/rollup-stats.ts
// Flush Redis counters → product_hourly_stats, and aggregate merchant outbound stats from
// tracking_events. หอมฉลุย — Powered by 2T9COME. Runs hourly (also safe to run more often).
import { db } from "@homchalui/db";
import { takeDirty, takeCounter, KEY, hourBucket, uniqueClickerCount, dateKey } from "@homchalui/redis";

/**
 * Flush product view/outbound/detail counters for the PREVIOUS hour bucket (so the current
 * hour keeps accumulating). Upserts one product_hourly_stats row per (product, locale, hour).
 */
export async function rollupHourlyStats(now = new Date()): Promise<{ products: number }> {
  // Previous full hour bucket, e.g. now=10:05 → flush the 09:00 bucket window.
  const prev = new Date(now.getTime() - 3600_000);
  const bucket = hourBucket(prev); // "2026-06-03T09"
  const calculatedAt = new Date(`${bucket}:00:00.000Z`);

  const dirty = await takeDirty(bucket);
  let products = 0;

  for (const { productId, locale } of dirty) {
    const loc = locale as "th" | "en" | "zh";
    const [views, outbound, detail] = await Promise.all([
      takeCounter(KEY.viewCounter(productId, loc, bucket)),
      takeCounter(KEY.outboundCounter(productId, loc, bucket)),
      takeCounter(KEY.detailCounter(productId, loc, bucket)),
    ]);
    const ctr = views > 0 ? outbound / views : 0;

    await db.productHourlyStat.upsert({
      where: { productId_locale_calculatedAt: { productId, locale: loc, calculatedAt } },
      update: { views, outboundClicks: outbound, detailClicks: detail, ctr },
      create: {
        productId, locale: loc, calculatedAt,
        views, outboundClicks: outbound, detailClicks: detail,
        wishlist: 0, reviewEngagement: 0, ctr,
      },
    });
    products++;
  }
  return { products };
}

/**
 * Aggregate today's merchant outbound clicks from tracking_events → merchant_click_stats.
 * Unique clickers come from the Redis HyperLogLog populated on each /go hit.
 */
export async function rollupMerchantStats(now = new Date()): Promise<{ merchants: number }> {
  const date = dateKey(now);
  const dayStart = new Date(`${date}T00:00:00.000Z`);

  const grouped = await db.trackingEvent.groupBy({
    by: ["merchantId", "locale"],
    where: { event: "affiliate_outbound_click", merchantId: { not: null }, createdAt: { gte: dayStart } },
    _count: { _all: true },
  });

  let merchants = 0;
  for (const g of grouped) {
    if (!g.merchantId) continue;
    const loc = g.locale as "th" | "en" | "zh";
    const outboundClicks = g._count._all;
    const uniqueClickers = await uniqueClickerCount(g.merchantId, loc, date);
    const ctr = uniqueClickers > 0 ? outboundClicks / uniqueClickers : 0;

    await db.merchantClickStat.upsert({
      where: { merchantId_locale_date: { merchantId: g.merchantId, locale: loc, date: dayStart } },
      update: { outboundClicks, uniqueClickers, ctr },
      create: { merchantId: g.merchantId, locale: loc, date: dayStart, outboundClicks, uniqueClickers, ctr },
    });
    merchants++;
  }
  return { merchants };
}

export async function rollupStatsJob(): Promise<void> {
  const a = await rollupHourlyStats();
  const b = await rollupMerchantStats();
  console.log(`[rollup] hourly products=${a.products} merchants=${b.merchants}`);
}
