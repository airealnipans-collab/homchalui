// packages/validators/src/admin.ts
// Backoffice (admin) input schemas + permission keys. หอมฉลุย — Powered by 2T9COME.
// Boundary validation for /api/admin/* and the RHF product editor. See API_CONTRACTS.md +
// BACKOFFICE_SPECS.md. Pure Zod (no server imports) so the editor can reuse it client-side.
import { z } from "zod";

// ───────────────────────── RBAC ─────────────────────────
export const PERMISSIONS = [
  "product.create", "product.update", "product.delete", "review.publish", "seo.update",
  "layout.update", "algorithm.update", "translation.update", "analytics.view", "user.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// ───────────────────────── Shared ─────────────────────────
export const publishStatus = z.enum(["draft", "published", "archived"]);
export const adminLocale = z.enum(["th", "en", "zh"]);
const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");
const score = z.coerce.number().min(0).max(10);
const faqItem = z.object({ q: z.string().min(1), a: z.string().min(1) });

export const SCORE_KEYS = [
  "scent", "longevity", "projection", "sillage", "value", "sweetness", "freshness", "luxury", "beginnerFriendly",
] as const;

const scoreField = score.optional();
export const scoresInput = z.object({
  scent: scoreField,
  longevity: scoreField,
  projection: scoreField,
  sillage: scoreField,
  value: scoreField,
  sweetness: scoreField,
  freshness: scoreField,
  luxury: scoreField,
  beginnerFriendly: scoreField,
});

export const scentProfileInput = z.object({
  scentFamily: z.string().min(1).optional(),
  mood: z.array(z.string()).default([]),
  season: z.array(z.string()).default([]),
  occasion: z.array(z.string()).default([]),
  genderTarget: z.string().min(1).optional(),
  topNotes: z.array(z.string()).default([]),
  middleNotes: z.array(z.string()).default([]),
  baseNotes: z.array(z.string()).default([]),
});

// ───────────────────────── Product translation ─────────────────────────
export const productTranslationInput = z
  .object({
    locale: adminLocale,
    name: z.string().min(1).max(200),
    slug,
    shortDescription: z.string().max(400).optional(),
    fullDescription: z.string().optional(),
    reviewSummary: z.string().optional(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    bestFor: z.string().optional(),
    notFor: z.string().optional(),
    seoTitle: z.string().max(200).optional(),
    seoDescription: z.string().max(320).optional(),
    ogImageUrl: z.string().url().optional(),
    canonicalUrl: z.string().url().optional(),
    aeoSummary: z.string().optional(),
    faqItems: z.array(faqItem).optional(),
    translationStatus: z.enum(["draft", "needs_review", "approved", "published"]).default("draft"),
  })
  // Integrity: cannot publish a locale without the required fields (BACKOFFICE_SPECS §2 validation).
  .superRefine((t, ctx) => {
    if (t.translationStatus === "published" && !t.shortDescription) {
      ctx.addIssue({ code: "custom", path: ["shortDescription"], message: "shortDescription required to publish a locale" });
    }
  });
export type ProductTranslationInput = z.infer<typeof productTranslationInput>;

// ───────────────────────── Product upsert ─────────────────────────
const productBase = z.object({
  brandId: z.string().min(1),
  primaryCategoryId: z.string().min(1),
  status: publishStatus.default("draft"),
  priceMin: z.coerce.number().nonnegative().nullable().optional(),
  priceMax: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().min(1).default("THB"),
  mainImageUrl: z.string().url().nullable().optional(),
  manualBoost: z.coerce.number().default(0),
  manualPin: z.boolean().default(false),
  excludeFromRanking: z.boolean().default(false),
  campaignTag: z.string().nullable().optional(),
  scores: scoresInput.optional(),
  scentProfile: scentProfileInput.optional(),
});

function priceOrder(d: { priceMin?: number | null; priceMax?: number | null }, ctx: z.RefinementCtx) {
  if (d.priceMin != null && d.priceMax != null && d.priceMin > d.priceMax) {
    ctx.addIssue({ code: "custom", path: ["priceMax"], message: "priceMax must be ≥ priceMin" });
  }
}

/** POST /api/admin/products — requires ≥1 translation. */
export const productCreate = productBase
  .extend({ translations: z.array(productTranslationInput).min(1) })
  .superRefine(priceOrder);
export type ProductCreate = z.infer<typeof productCreate>;

/** PATCH /api/admin/products/:id — all fields optional; translations upserted by locale. */
export const productUpdate = productBase
  .partial()
  .extend({ translations: z.array(productTranslationInput).optional() })
  .superRefine(priceOrder);
export type ProductUpdate = z.infer<typeof productUpdate>;

// ───────────────────────── Merchant links ─────────────────────────
export const merchantLinkUpsert = z.object({
  merchantId: z.string().min(1),
  normalUrl: z.string().url().nullable().optional(),
  affiliateUrl: z.string().url(),
  price: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().min(1).default("THB"),
  priority: z.coerce.number().int().default(0),
  status: z.enum(["active", "broken", "disabled"]).default("active"),
});
export type MerchantLinkUpsert = z.infer<typeof merchantLinkUpsert>;
export const merchantLinkUpdate = merchantLinkUpsert.partial();
export type MerchantLinkUpdate = z.infer<typeof merchantLinkUpdate>;

// ───────────────────────── Reviews ─────────────────────────
// Integrity (CLAUDE.md §2.6): no fake reviews; `tested` only when genuinely tested (UI requires an
// explicit confirm); `sponsored` is stored and surfaced with a visible label on the front.
const reviewBase = z.object({
  productId: z.string().min(1),
  locale: adminLocale,
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  reviewer: z.string().max(120).optional(),
  rating: z.coerce.number().min(0).max(5),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  bestFor: z.string().optional(),
  notFor: z.string().optional(),
  tested: z.boolean().default(false),
  sponsored: z.boolean().default(false),
  published: z.boolean().default(false), // maps to publishedAt
});

export const reviewCreate = reviewBase;
export type ReviewCreate = z.infer<typeof reviewCreate>;
export const reviewUpdate = reviewBase.partial();
export type ReviewUpdate = z.infer<typeof reviewUpdate>;

// ───────────────────────── Uploads ─────────────────────────
export const IMAGE_MIME = ["image/png", "image/jpeg", "image/webp", "image/avif"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const uploadMeta = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum(IMAGE_MIME),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});
export type UploadMeta = z.infer<typeof uploadMeta>;
