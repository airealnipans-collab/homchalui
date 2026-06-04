// packages/validators/src/query.ts
// Shared query-param primitives for public list/search APIs. หอมฉลุย — Powered by 2T9COME.
// Locale-aware, published-only reads resolve locale: ?locale= → (caller may pass path prefix) →
// th. See docs/API_CONTRACTS.md §Conventions.
import { z } from "zod";

/** Locale query param (defaults to Thai). Named distinctly from tracking's `localeSchema`. */
export const localeQuery = z.enum(["th", "en", "zh"]).default("th");

/** Pagination. Bad values (0, negative, non-numeric) → ZodError → 422. */
export const pageParam = z.coerce.number().int().min(1).default(1);
export const limitParam = z.coerce.number().int().min(1).max(60).default(24);

/** Sort keys accepted by /api/products and /api/search (docs/API_CONTRACTS.md). */
export const SORTS = [
  "recommended",
  "trending",
  "most_clicked",
  "best_reviewed",
  "price_asc",
  "price_desc",
  "longevity",
  "beginner",
] as const;
export type Sort = (typeof SORTS)[number];
export const sortParam = z.enum(SORTS).default("recommended");

/** Sorts served from a Redis ranking sorted set (rank:{key}:{locale}) instead of the DB. */
export const REDIS_SORTS: Record<string, "trending" | "best_click"> = {
  trending: "trending",
  most_clicked: "best_click",
};

/** GET /api/categories query. `tree=true` returns a nested tree; otherwise a flat list. */
export const categoryQuery = z.object({
  locale: localeQuery,
  // z.coerce.boolean treats any non-empty string as true, so map the literals explicitly.
  tree: z.optional(z.enum(["true", "false"])).transform((v) => v === "true"),
});
export type CategoryQuery = z.infer<typeof categoryQuery>;

/**
 * Turn URLSearchParams into a plain object, dropping empty values so Zod `.default()` applies
 * for absent/blank params (an empty string is NOT undefined and would defeat defaults).
 */
export function queryToObject(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of sp.entries()) {
    if (v !== "") out[k] = v;
  }
  return out;
}
