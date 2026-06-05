// packages/validators/src/layout.ts
// Layout Builder section schemas. หอมฉลุย — Powered by 2T9COME.
// Each section type has its own config schema (validated on save + before render). custom_html is
// sanitized at render time. See BACKOFFICE_SPECS §4 + COMPONENT_LIBRARY `LayoutSectionRenderer`.
import { z } from "zod";
import { adminLocale } from "./admin";

export const SECTION_TYPES = [
  "hero", "product_carousel", "category_grid", "trending_list", "editorial_picks", "article_block", "custom_html",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const limit = z.coerce.number().int().min(1).max(24);

export const heroConfig = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string().url().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});
export const productCarouselConfig = z.object({
  title: z.string().min(1),
  source: z.enum(["trending", "most_clicked", "latest", "category", "best"]).default("latest"),
  category: z.string().optional(),
  campaignTag: z.string().optional(),
  limit: limit.default(12),
});
export const categoryGridConfig = z.object({
  title: z.string().optional(),
  limit: limit.default(12),
});
export const trendingListConfig = z.object({
  title: z.string().min(1),
  limit: limit.default(12),
});
export const editorialPicksConfig = z.object({
  title: z.string().min(1),
  productIds: z.array(z.string()).optional(),
  campaignTag: z.string().optional(),
  limit: limit.default(12),
});
export const articleBlockConfig = z.object({
  title: z.string().optional(),
  kind: z.enum(["guide", "article"]).default("article"),
  limit: z.coerce.number().int().min(1).max(12).default(6),
});
export const customHtmlConfig = z.object({ html: z.string().default("") });

export const sectionConfigByType = {
  hero: heroConfig,
  product_carousel: productCarouselConfig,
  category_grid: categoryGridConfig,
  trending_list: trendingListConfig,
  editorial_picks: editorialPicksConfig,
  article_block: articleBlockConfig,
  custom_html: customHtmlConfig,
} satisfies Record<SectionType, z.ZodTypeAny>;

/** Parse a section's raw config against its type schema. Returns null on failure. */
export function parseSectionConfig(type: SectionType, config: unknown): Record<string, unknown> | null {
  const res = sectionConfigByType[type].safeParse(config);
  return res.success ? (res.data as Record<string, unknown>) : null;
}

export const layoutSectionInput = z
  .object({
    type: z.enum(SECTION_TYPES),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
    config: z.record(z.unknown()),
  })
  .superRefine((s, ctx) => {
    const res = sectionConfigByType[s.type].safeParse(s.config);
    if (!res.success) {
      ctx.addIssue({ code: "custom", path: ["config"], message: `invalid config for ${s.type}: ${res.error.issues[0]?.message ?? "invalid"}` });
    }
  });
export type LayoutSectionInput = z.infer<typeof layoutSectionInput>;

export const layoutUpsert = z.object({
  key: z.string().min(1).default("home"),
  locale: adminLocale,
  status: z.enum(["draft", "published"]).default("draft"),
  sections: z.array(layoutSectionInput),
});
export type LayoutUpsert = z.infer<typeof layoutUpsert>;

export const layoutSectionUpdate = z.object({
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});
export type LayoutSectionUpdate = z.infer<typeof layoutSectionUpdate>;
