// packages/validators/src/product.ts
// Product filter/query + ProductCard view-model schemas. หอมฉลุย — Powered by 2T9COME.
// Boundary validation for GET /api/products and GET /api/search (docs/API_CONTRACTS.md).
import { z } from "zod";
import { localeQuery, pageParam, limitParam, sortParam } from "./query";

/** Merchant keys mirror the Prisma `MerchantKey` enum (merchant list stays data-driven). */
export const MERCHANT_KEYS = ["shopee", "lazada", "central", "amazon", "tiktok", "official", "custom"] as const;

/** Badge kinds — data-derived, never arbitrary (docs/COMPONENT_LIBRARY.md `Badge`). */
export const badgeKind = z.enum(["trending", "best_seller", "best_value", "luxury", "long_lasting"]);
export type BadgeKind = z.infer<typeof badgeKind>;

/** Raw filter shape, shared by the list + search queries. Numbers coerce from query strings. */
const filterShape = {
  category: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  scent: z.string().min(1).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  gender: z.string().min(1).optional(),
  mood: z.string().min(1).optional(),
  season: z.string().min(1).optional(),
  occasion: z.string().min(1).optional(),
  longevity: z.coerce.number().min(0).max(10).optional(),
  projection: z.coerce.number().min(0).max(10).optional(),
  merchant: z.enum(MERCHANT_KEYS).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  value: z.coerce.number().min(0).max(10).optional(),
} as const;

/** Base object (no refinement) so it can be `.extend()`ed for search. */
export const productListShape = z.object({
  ...filterShape,
  locale: localeQuery,
  sort: sortParam,
  page: pageParam,
  limit: limitParam,
});
export type ProductListShape = z.infer<typeof productListShape>;

/** minPrice ≤ maxPrice when both are present. */
function priceOrder(d: { minPrice?: number; maxPrice?: number }, ctx: z.RefinementCtx) {
  if (d.minPrice != null && d.maxPrice != null && d.minPrice > d.maxPrice) {
    ctx.addIssue({ code: "custom", path: ["maxPrice"], message: "maxPrice must be ≥ minPrice" });
  }
}

/** GET /api/products query. */
export const productListQuery = productListShape.superRefine(priceOrder);
export type ProductListQuery = z.infer<typeof productListQuery>;

/** GET /api/search query — same filters/sort/pagination plus a required `q`. */
export const searchQuery = productListShape
  .extend({ q: z.string().trim().min(1).max(120) })
  .superRefine(priceOrder);
export type SearchQuery = z.infer<typeof searchQuery>;

// ───────────────────────── Output view-models ─────────────────────────
export const ratingVM = z.object({ value: z.number(), count: z.number().int().nonnegative() });

export const productCardVM = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.object({ name: z.string(), slug: z.string() }),
  image: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  currency: z.string(),
  rating: ratingVM.nullable(),
  badges: z.array(badgeKind),
  longevity: z.number().optional(),
  moodOrOccasion: z.string().optional(),
  outboundClicks: z.number().optional(),
});
export type ProductCardVM = z.infer<typeof productCardVM>;

export const listMeta = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type ListMeta = z.infer<typeof listMeta>;

export const productListResult = z.object({ items: z.array(productCardVM), meta: listMeta });
export type ProductListResult = z.infer<typeof productListResult>;

export const searchResult = productListResult.extend({
  zeroResult: z.boolean(),
  didYouMean: z.string().optional(),
});
export type SearchResult = z.infer<typeof searchResult>;
