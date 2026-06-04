// packages/ranking/src/trending.ts
// Pure ranking functions (unit-testable, no I/O). หอมฉลุย — Powered by 2T9COME.
// Weights come from ranking_configs in the DB (admin-tunable) — never hardcode at the call site.

export interface TrendingWeights {
  view_count: number;
  outbound_click: number;
  product_detail_click: number;
  wishlist_count: number;
  review_engagement: number;
}

export const DEFAULT_TRENDING_WEIGHTS: TrendingWeights = {
  view_count: 1,
  outbound_click: 3,
  product_detail_click: 2,
  wishlist_count: 2,
  review_engagement: 1.5,
};

export interface TrendingInput {
  views: number;
  outboundClicks: number;
  detailClicks: number;
  wishlist: number;
  reviewEngagement: number;
  /** 0..1 — fraction of sessions that bounced; multiplied by bouncePenalty. */
  bounceRate?: number;
}

/**
 * trending_score = views*w_view + outbound*w_out + detail*w_detail + wishlist*w_wish
 *                  + reviewEngagement*w_review − bounceRate*bouncePenalty
 * Manual boost is added by the caller after scoring; pinned items are forced to the top.
 */
export function computeTrendingScore(
  input: TrendingInput,
  weights: TrendingWeights = DEFAULT_TRENDING_WEIGHTS,
  bouncePenalty = 0,
): number {
  const base =
    input.views * weights.view_count +
    input.outboundClicks * weights.outbound_click +
    input.detailClicks * weights.product_detail_click +
    input.wishlist * weights.wishlist_count +
    input.reviewEngagement * weights.review_engagement;
  const penalty = (input.bounceRate ?? 0) * bouncePenalty;
  return Math.max(0, base - penalty);
}

/** Coerce an unknown JSON weights blob (from ranking_configs) into TrendingWeights. */
export function asTrendingWeights(raw: unknown): TrendingWeights {
  const w = (raw ?? {}) as Partial<TrendingWeights>;
  return {
    view_count: num(w.view_count, DEFAULT_TRENDING_WEIGHTS.view_count),
    outbound_click: num(w.outbound_click, DEFAULT_TRENDING_WEIGHTS.outbound_click),
    product_detail_click: num(w.product_detail_click, DEFAULT_TRENDING_WEIGHTS.product_detail_click),
    wishlist_count: num(w.wishlist_count, DEFAULT_TRENDING_WEIGHTS.wishlist_count),
    review_engagement: num(w.review_engagement, DEFAULT_TRENDING_WEIGHTS.review_engagement),
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
