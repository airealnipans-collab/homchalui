// packages/ranking/src/best-click.ts
// Pure best-click (sales-proxy) ranking. หอมฉลุย — Powered by 2T9COME.
// Weights come from ranking_configs (admin-tunable). Outbound clicks are the primary signal.
export interface BestClickWeights {
  outbound_click: number;
  unique_clicker: number;
  ctr: number;
}

export const DEFAULT_BEST_CLICK_WEIGHTS: BestClickWeights = {
  outbound_click: 5,
  unique_clicker: 3,
  ctr: 2,
};

export interface BestClickInput {
  outboundClicks: number;
  uniqueClickers?: number;
  ctr?: number; // 0..1
}

export function computeBestClickScore(input: BestClickInput, weights: BestClickWeights = DEFAULT_BEST_CLICK_WEIGHTS): number {
  return Math.max(
    0,
    input.outboundClicks * weights.outbound_click +
      (input.uniqueClickers ?? 0) * weights.unique_clicker +
      (input.ctr ?? 0) * 100 * weights.ctr,
  );
}

export function asBestClickWeights(raw: unknown): BestClickWeights {
  const w = (raw ?? {}) as Partial<BestClickWeights>;
  const num = (v: unknown, f: number) => (typeof v === "number" && Number.isFinite(v) ? v : f);
  return {
    outbound_click: num(w.outbound_click, DEFAULT_BEST_CLICK_WEIGHTS.outbound_click),
    unique_clicker: num(w.unique_clicker, DEFAULT_BEST_CLICK_WEIGHTS.unique_clicker),
    ctr: num(w.ctr, DEFAULT_BEST_CLICK_WEIGHTS.ctr),
  };
}
