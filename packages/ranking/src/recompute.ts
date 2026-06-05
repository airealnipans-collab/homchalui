// packages/ranking/src/recompute.ts
// Ranking recompute (I/O) — shared by the worker (scheduled) and the admin recalculate/preview.
// หอมฉลุย — Powered by 2T9COME. Pure scoring lives in trending/best-click/editorial; this layer
// reads stats/scores + active ranking_configs, writes the Redis sorted set + ranking_snapshots.
import { db } from "@homchalui/db";
import { redis, KEY } from "@homchalui/redis";
import { computeTrendingScore, asTrendingWeights } from "./trending";
import { computeBestClickScore, asBestClickWeights } from "./best-click";
import { computeEditorialScore, asEditorialWeights } from "./editorial";

export type RankKey = "trending" | "best_click" | "editorial";
export const RANK_KEYS: RankKey[] = ["trending", "best_click", "editorial"];
export const RANK_LOCALES = ["th", "en", "zh"] as const;
export type RankLocale = (typeof RANK_LOCALES)[number];

export interface ScoredProduct {
  productId: string;
  score: number;
}

const PIN_BOOST = 1_000_000;

async function activeConfig(key: RankKey): Promise<{ weights: unknown; bouncePenalty: number }> {
  const cfg = await db.rankingConfig.findFirst({ where: { key, isActive: true }, orderBy: { version: "desc" } });
  return { weights: cfg?.weights ?? null, bouncePenalty: cfg?.bouncePenalty ?? 0 };
}

/** Compute scores for (key, locale) — published, locale-available, non-excluded products only. */
export async function scoreRanking(key: RankKey, locale: RankLocale): Promise<ScoredProduct[]> {
  const { weights, bouncePenalty } = await activeConfig(key);

  if (key === "editorial") {
    const prods = await db.product.findMany({
      where: {
        status: "published",
        excludeFromRanking: false,
        translations: { some: { locale, translationStatus: "published" } },
        scores: { isNot: null },
      },
      select: { id: true, manualBoost: true, manualPin: true, scores: true },
    });
    const w = asEditorialWeights(weights);
    return prods
      .map((p) => {
        const s = p.scores!;
        let score = computeEditorialScore({ overallCached: s.overallCached, luxury: s.luxury, value: s.value, beginnerFriendly: s.beginnerFriendly }, w) + p.manualBoost;
        if (p.manualPin) score += PIN_BOOST;
        return { productId: p.id, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Stats-based (trending / best_click): last 24h hourly stats per product+locale.
  const since = new Date(Date.now() - 24 * 3600_000);
  const agg = await db.productHourlyStat.groupBy({
    by: ["productId"],
    where: { locale, calculatedAt: { gte: since } },
    _sum: { views: true, outboundClicks: true, detailClicks: true, wishlist: true, reviewEngagement: true },
  });
  if (agg.length === 0) return [];

  const ids = agg.map((a) => a.productId);
  const prods = await db.product.findMany({
    where: { id: { in: ids }, status: "published", excludeFromRanking: false, translations: { some: { locale, translationStatus: "published" } } },
    select: { id: true, manualBoost: true, manualPin: true },
  });
  const flags = new Map(prods.map((p) => [p.id, p]));

  return agg
    .filter((a) => flags.has(a.productId))
    .map((a) => {
      const f = flags.get(a.productId)!;
      const sum = a._sum;
      let score =
        key === "best_click"
          ? computeBestClickScore({ outboundClicks: sum.outboundClicks ?? 0 }, asBestClickWeights(weights))
          : computeTrendingScore(
              { views: sum.views ?? 0, outboundClicks: sum.outboundClicks ?? 0, detailClicks: sum.detailClicks ?? 0, wishlist: sum.wishlist ?? 0, reviewEngagement: sum.reviewEngagement ?? 0 },
              asTrendingWeights(weights),
              bouncePenalty,
            );
      score += f.manualBoost;
      if (f.manualPin) score += PIN_BOOST;
      return { productId: a.productId, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** Preview only — no writes. */
export async function previewRanking(key: RankKey, locale: RankLocale, limit = 20): Promise<ScoredProduct[]> {
  return (await scoreRanking(key, locale)).slice(0, limit);
}

/** Recompute + persist: Redis sorted set (hot path) + ranking_snapshots (durable). */
export async function recomputeRanking(key: RankKey, locale: RankLocale): Promise<number> {
  const scored = await scoreRanking(key, locale);

  const zkey = KEY.rank(key, locale);
  const pipe = redis().pipeline();
  pipe.del(zkey);
  for (const s of scored) pipe.zadd(zkey, s.score, s.productId);
  pipe.expire(zkey, 2 * 3600);
  await pipe.exec();

  const computedAt = new Date();
  await db.rankingSnapshot.deleteMany({ where: { key, locale } });
  if (scored.length > 0) {
    await db.rankingSnapshot.createMany({
      data: scored.map((s, i) => ({ key, locale, productId: s.productId, score: s.score, rank: i + 1, computedAt })),
    });
  }
  return scored.length;
}

export async function recomputeAll(): Promise<void> {
  for (const key of RANK_KEYS) {
    for (const locale of RANK_LOCALES) {
      const n = await recomputeRanking(key, locale);
      console.log(`[ranking] ${key} ${locale}: ${n} products`);
    }
  }
}
