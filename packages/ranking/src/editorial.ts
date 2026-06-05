// packages/ranking/src/editorial.ts
// Pure editorial ranking (curated quality). หอมฉลุย — Powered by 2T9COME.
// Driven by ProductScore (editorial assessment), not traffic. Weights from ranking_configs.
export interface EditorialWeights {
  overall: number;
  luxury: number;
  value: number;
  beginner: number;
}

export const DEFAULT_EDITORIAL_WEIGHTS: EditorialWeights = {
  overall: 5,
  luxury: 1.5,
  value: 1.5,
  beginner: 1,
};

export interface EditorialInput {
  overallCached: number;
  luxury: number;
  value: number;
  beginnerFriendly: number;
}

export function computeEditorialScore(input: EditorialInput, weights: EditorialWeights = DEFAULT_EDITORIAL_WEIGHTS): number {
  return Math.max(
    0,
    input.overallCached * weights.overall +
      input.luxury * weights.luxury +
      input.value * weights.value +
      input.beginnerFriendly * weights.beginner,
  );
}

export function asEditorialWeights(raw: unknown): EditorialWeights {
  const w = (raw ?? {}) as Partial<EditorialWeights>;
  const num = (v: unknown, f: number) => (typeof v === "number" && Number.isFinite(v) ? v : f);
  return {
    overall: num(w.overall, DEFAULT_EDITORIAL_WEIGHTS.overall),
    luxury: num(w.luxury, DEFAULT_EDITORIAL_WEIGHTS.luxury),
    value: num(w.value, DEFAULT_EDITORIAL_WEIGHTS.value),
    beginner: num(w.beginner, DEFAULT_EDITORIAL_WEIGHTS.beginner),
  };
}
