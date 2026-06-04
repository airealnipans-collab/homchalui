// apps/web/lib/locale.ts
// Locale routing helpers + per-entity alternates. หอมฉลุย — Powered by 2T9COME.
// Alternates power the LanguageSwitcher (maps to the EQUIVALENT entity per locale) and hreflang.
// Only locales with a real (published) translation are included — never a Thai fallback.
import { db } from "@homchalui/db";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { clientEnv } from "@homchalui/config/env";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Locales that carry a URL prefix. Thai (default) has none; `/th` never exists. */
export type PrefixedLocale = "en" | "zh";
export function parsePrefixedLocale(value: string): PrefixedLocale | null {
  return value === "en" || value === "zh" ? value : null;
}

/** locale → localized relative path of the equivalent entity (only where it exists). */
export type Alternates = Partial<Record<Locale, string>>;

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

/**
 * Convert alternates → Next `Metadata.alternates` (absolute URLs). Emits hreflang per locale +
 * `x-default` (Thai when present). The LanguageSwitcher reads these <link> tags from the DOM.
 */
export function metadataAlternates(canonicalPath: string, alts: Alternates): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  for (const [loc, path] of Object.entries(alts)) languages[loc] = `${SITE}${path}`;
  if (alts.th) languages["x-default"] = `${SITE}${alts.th}`;
  return { canonical: `${SITE}${canonicalPath}`, languages };
}
