// apps/web/lib/locale.ts
// Locale routing helpers + per-entity alternates. หอมฉลุย — Powered by 2T9COME.
// Alternates power the LanguageSwitcher (maps to the EQUIVALENT entity per locale) and hreflang
// (lib/seo/hreflang.ts). Only locales with a real (published) translation are included — never a
// Thai fallback. Canonical/hreflang formatting lives in lib/seo/hreflang (re-exported here).
import { db } from "@homchalui/db";
import { localizedPath, type Locale } from "@homchalui/i18n";
import type { Alternates } from "./seo/hreflang";

export { metadataAlternates } from "./seo/hreflang";
export type { Alternates } from "./seo/hreflang";

/** Locales that carry a URL prefix. Thai (default) has none; `/th` never exists. */
export type PrefixedLocale = "en" | "zh";
export function parsePrefixedLocale(value: string): PrefixedLocale | null {
  return value === "en" || value === "zh" ? value : null;
}

export async function productAlternates(productId: string): Promise<Alternates> {
  const trs = await db.productTranslation.findMany({
    where: { productId, translationStatus: "published" },
    select: { locale: true, slug: true },
  });
  const out: Alternates = {};
  for (const t of trs) out[t.locale] = localizedPath(t.locale, `/product/${t.slug}`);
  return out;
}

export async function categoryAlternates(categoryId: string): Promise<Alternates> {
  const trs = await db.categoryTranslation.findMany({ where: { categoryId }, select: { locale: true, slug: true } });
  const out: Alternates = {};
  for (const t of trs) out[t.locale] = localizedPath(t.locale, `/category/${t.slug}`);
  return out;
}

export async function brandAlternates(brandId: string): Promise<Alternates> {
  const trs = await db.brandTranslation.findMany({ where: { brandId }, select: { locale: true, slug: true } });
  const out: Alternates = {};
  for (const t of trs) out[t.locale] = localizedPath(t.locale, `/brand/${t.slug}`);
  return out;
}

export async function scentAlternates(family: string): Promise<Alternates> {
  // Scent family slug is shared across locales; include a locale only if it has a published product.
  const rows = await db.productTranslation.findMany({
    where: { translationStatus: "published", product: { status: "published", scentProfile: { scentFamily: family } } },
    select: { locale: true },
    distinct: ["locale"],
  });
  const out: Alternates = {};
  for (const r of rows) out[r.locale] = localizedPath(r.locale, `/scent/${family}`);
  return out;
}

/** Home exists in every locale. */
export function homeAlternates(): Alternates {
  return { th: "/", en: "/en", zh: "/zh" };
}
