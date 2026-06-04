// apps/worker/src/jobs/ranking.ts
// Recompute trending ranking per locale from product_hourly_stats (last 24h).
// หอมฉลุย — Powered by 2T9COME. Writes a Redis sorted set (served on the hot path) AND
// ranking_snapshots (durable/auditable). Weights come from ranking_configs (admin-tunable).
import { db } from "@homchalui/db";
import { redis, KEY } from "@homchalui/redis";
import { computeTrendingScore, asTrendingWeights, DEFAULT_TRENDING_WEIGHTS } from "@homchalui/ranking";

const LOCALES = ["th", "en", "zh"] as const;
type Loc = (typeof LOCALES)[number];

async function activeTrendingConfig() {
  const cfg = await db.rankingConfig.findFirst({
    where: { key: "trending", isActive: true },
    orderBy: { version: "desc" },
  });
  return {
    weights: cfg ? asTrendingWeights(cfg.weights) : DEFAULT_TRENDING_WEIGHTS,
    bouncePenalty: cfg?.bouncePenalty ?? 0,
  };
}

export async function recomputeTrendingForLocale(locale: Loc, since: Date): Promise<number> {
  const { weights, bouncePenalty } = await activeTrendingConfig();

  // Sum the last-24h hourly stats per product for this locale.
  const agg = await db.productHourlyStat.groupBy({
    by: ["productId"],
    where: { locale, calculatedAt: { gte: since } },
    _sum: { views: true, outboundClicks: true, detailClicks: true, wishlist: true, reviewEngagement: true },
  });
  if (agg.length === 0) return 0;

  // Product-level ranking flags.
  const ids = agg.map((a) => a.productId);
  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "published" },
    select: { id: true, manualBoost: true, manualPin: true, excludeFromRanking: true },
  });
  const flags = new Map(products.map((p) => [p.id, p]));

  const scored = agg
    .filter((a) => flags.has(a.productId) && !flags.get(a.productId)!.excludeFromRanking)
    .map((a) => {
      const f = flags.get(a.productId)!;
      let score =
        computeTrendingScore(
          {
            views: a._sum.views ?? 0,
            outboundClicks: a._sum.outboundClicks ?? 0,
            detailClicks: a._sum.detailClicks ?? 0,
            wishlist: a._sum.wishlist ?? 0,
            reviewEngagement: a._sum.reviewEngagement ?? 0,
          },
          weights,
          bouncePenalty,
        ) + f.manualBoost;
      if (f.manualPin) score += 1_000_000; // pinned items float to the top
      return { productId: a.productId, score };
    })
    .sort((x, y) => y.score - x.score);

  // 1) Redis sorted set for O(1) reads on the front.
  const zkey = KEY.rank("trending", locale);
  const pipe = redis().pipeline();
  pipe.del(zkey);
  for (const s of scored) pipe.zadd(zkey, s.score, s.productId);
  pipe.expire(zkey, 2 * 3600);
  await pipe.exec();

  // 2) Durable snapshot (replace previous).
  const computedAt = new Date();
  await db.rankingSnapshot.deleteMany({ where: { key: "trending", locale } });
  await db.rankingSnapshot.createMany({
    data: scored.map((s, i) => ({ key: "trending" as const, locale, productId: s.productId, score: s.score, rank: i + 1, computedAt })),
  });

  return scored.length;
}

export async function rankingJob(): Promise<void> {
  const since = new Date(Date.now() - 24 * 3600_000);
  for (const locale of LOCALES) {
    const n = await recomputeTrendingForLocale(locale, since);
    console.log(`[ranking] trending ${locale}: ${n} products`);
  }
}
