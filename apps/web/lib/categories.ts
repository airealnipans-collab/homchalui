// apps/web/lib/categories.ts
// Category / brand / scent-family resolvers — published-translation-only, cached. Powered by 2T9COME.
// NO Thai fallback: a missing translation in `locale` resolves to null → the page calls notFound().
import type { Metadata } from "next";
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { categoryAlternates, brandAlternates, scentAlternates } from "./locale";
import { buildMetadata, notFoundMetadata } from "./seo/metadata";

const NOT_FOUND: Record<Locale, { cat: string; brand: string; scent: string }> = {
  th: { cat: "ไม่พบหมวดหมู่ | หอมฉลุย", brand: "ไม่พบแบรนด์ | หอมฉลุย", scent: "ไม่พบกลิ่น | หอมฉลุย" },
  en: { cat: "Category not found | Homchalui", brand: "Brand not found | Homchalui", scent: "Scent not found | Homchalui" },
  zh: { cat: "未找到分类 | Homchalui", brand: "未找到品牌 | Homchalui", scent: "未找到香调 | Homchalui" },
};

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  aeoSummary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  parentId: string | null;
}

export function getCategoryBySlug(slug: string, locale: Locale): Promise<CategoryInfo | null> {
  return withCache(
    `cache:cat:resolve:${locale}:${slug}`,
    300,
    async () => {
      const tr = await db.categoryTranslation.findFirst({
        where: { locale, slug },
        select: {
          name: true, slug: true, description: true, aeoSummary: true, seoTitle: true, seoDescription: true,
          category: { select: { id: true, parentId: true } },
        },
      });
      if (!tr) return null;
      return {
        id: tr.category.id,
        name: tr.name,
        slug: tr.slug,
        description: tr.description,
        aeoSummary: tr.aeoSummary,
        seoTitle: tr.seoTitle,
        seoDescription: tr.seoDescription,
        parentId: tr.category.parentId,
      } satisfies CategoryInfo;
    },
    [`cat:${locale}:${slug}`],
  );
}

export interface BrandInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export function getBrandBySlug(slug: string, locale: Locale): Promise<BrandInfo | null> {
  return withCache(
    `cache:brand:resolve:${locale}:${slug}`,
    300,
    async () => {
      const tr = await db.brandTranslation.findFirst({
        where: { locale, slug },
        select: { name: true, slug: true, description: true, seoTitle: true, seoDescription: true, brandId: true },
      });
      if (!tr) return null;
      return {
        id: tr.brandId,
        name: tr.name,
        slug: tr.slug,
        description: tr.description,
        seoTitle: tr.seoTitle,
        seoDescription: tr.seoDescription,
      } satisfies BrandInfo;
    },
    [`brand:${locale}:${slug}`],
  );
}

// Scent families have no translation table — the slug IS the family key (e.g. "woody"). We show a
// localized label and only render the page if at least one published product uses that family.
export const SCENT_FAMILY_LABELS: Record<string, Record<Locale, string>> = {
  fresh: { th: "กลิ่นสดชื่น", en: "Fresh", zh: "清新调" },
  floral: { th: "กลิ่นดอกไม้", en: "Floral", zh: "花香调" },
  woody: { th: "กลิ่นไม้", en: "Woody", zh: "木质调" },
  citrus: { th: "กลิ่นซิตรัส", en: "Citrus", zh: "柑橘调" },
  sweet: { th: "กลิ่นหวาน", en: "Sweet / Gourmand", zh: "甜美调" },
  oriental: { th: "กลิ่นโอเรียนทัล", en: "Oriental", zh: "东方调" },
  aquatic: { th: "กลิ่นทะเล", en: "Aquatic", zh: "海洋调" },
};

export interface ScentInfo {
  slug: string;
  name: string;
}

/** Returns the family info if any published product in `locale` uses it, else null (→ notFound). */
export function getScentFamily(slug: string, locale: Locale): Promise<ScentInfo | null> {
  return withCache(
    `cache:scent:resolve:${locale}:${slug}`,
    300,
    async () => {
      const exists = await db.productTranslation.findFirst({
        where: {
          locale,
          translationStatus: "published",
          product: { status: "published", scentProfile: { scentFamily: slug } },
        },
        select: { id: true },
      });
      if (!exists) return null;
      const name = SCENT_FAMILY_LABELS[slug]?.[locale] ?? slug;
      return { slug, name } satisfies ScentInfo;
    },
    [`scent:${locale}:${slug}`],
  );
}

// ───────────────────────── Page metadata (canonical + hreflang) ─────────────────────────

export async function categoryMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const cat = await getCategoryBySlug(slug, locale);
  if (!cat) return notFoundMetadata(NOT_FOUND[locale].cat);
  return buildMetadata({
    locale,
    title: cat.seoTitle ?? `${cat.name} | หอมฉลุย`,
    description: cat.seoDescription ?? cat.description,
    canonicalPath: localizedPath(locale, `/category/${cat.slug}`),
    alternates: await categoryAlternates(cat.id),
  });
}

export async function brandMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const brand = await getBrandBySlug(slug, locale);
  if (!brand) return notFoundMetadata(NOT_FOUND[locale].brand);
  return buildMetadata({
    locale,
    title: brand.seoTitle ?? `${brand.name} | หอมฉลุย`,
    description: brand.seoDescription ?? brand.description,
    canonicalPath: localizedPath(locale, `/brand/${brand.slug}`),
    alternates: await brandAlternates(brand.id),
  });
}

export async function scentMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const scent = await getScentFamily(slug, locale);
  if (!scent) return notFoundMetadata(NOT_FOUND[locale].scent);
  return buildMetadata({
    locale,
    title: `${scent.name} | หอมฉลุย`,
    description: `รวมของหอมกลิ่น${scent.name} ที่รีวิวและเปรียบเทียบโดยหอมฉลุย`,
    canonicalPath: localizedPath(locale, `/scent/${scent.slug}`),
    alternates: await scentAlternates(scent.slug),
  });
}
