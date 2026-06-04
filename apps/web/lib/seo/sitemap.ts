// apps/web/lib/seo/sitemap.ts
// Sitemap data + XML rendering. หอมฉลุย — Powered by 2T9COME.
// Per-locale sitemaps list ONLY published URLs for that locale, each with xhtml:link hreflang
// alternates limited to locales where the entity actually exists (no Thai fallback).
import { db } from "@homchalui/db";
import { localizedPath, LOCALES, type Locale } from "@homchalui/i18n";
import { absoluteUrl, hreflangLinksXml, type Alternates } from "./hreflang";

export interface UrlEntry {
  loc: string;
  alternates: Alternates;
}

/** Group every entity's localized paths by id/family → { locale: path } maps. */
async function entryGroups() {
  const [prodTrs, catTrs, brandTrs, scentRows] = await Promise.all([
    db.productTranslation.findMany({
      where: { translationStatus: "published", product: { status: "published" } },
      select: { productId: true, locale: true, slug: true },
    }),
    db.categoryTranslation.findMany({ select: { categoryId: true, locale: true, slug: true } }),
    db.brandTranslation.findMany({ select: { brandId: true, locale: true, slug: true } }),
    db.productTranslation.findMany({
      where: { translationStatus: "published", product: { status: "published", scentProfile: { scentFamily: { not: null } } } },
      select: { locale: true, product: { select: { scentProfile: { select: { scentFamily: true } } } } },
    }),
  ]);

  const add = (map: Map<string, Alternates>, key: string, locale: Locale, path: string) => {
    const m = map.get(key) ?? {};
    m[locale] = path;
    map.set(key, m);
  };

  const products = new Map<string, Alternates>();
  for (const t of prodTrs) add(products, t.productId, t.locale, localizedPath(t.locale, `/product/${t.slug}`));
  const categories = new Map<string, Alternates>();
  for (const t of catTrs) add(categories, t.categoryId, t.locale, localizedPath(t.locale, `/category/${t.slug}`));
  const brands = new Map<string, Alternates>();
  for (const t of brandTrs) add(brands, t.brandId, t.locale, localizedPath(t.locale, `/brand/${t.slug}`));
  const scents = new Map<string, Alternates>();
  for (const r of scentRows) {
    const fam = r.product.scentProfile?.scentFamily;
    if (fam) add(scents, fam, r.locale, localizedPath(r.locale, `/scent/${fam}`));
  }

  return [products, categories, brands, scents];
}

const HOME_ALTERNATES: Alternates = { th: "/", en: "/en", zh: "/zh" };

/** All published URL entries for a locale (home + products + categories + brands + scents). */
export async function localeUrlEntries(locale: Locale): Promise<UrlEntry[]> {
  const groups = await entryGroups();
  const entries: UrlEntry[] = [{ loc: absoluteUrl(HOME_ALTERNATES[locale]!), alternates: HOME_ALTERNATES }];
  for (const group of groups) {
    for (const alts of group.values()) {
      const self = alts[locale];
      if (self) entries.push({ loc: absoluteUrl(self), alternates: alts });
    }
  }
  return entries;
}

export async function localeSitemapXml(locale: Locale): Promise<string> {
  const entries = await localeUrlEntries(locale);
  const urls = entries.map((e) => `<url><loc>${e.loc}</loc>${hreflangLinksXml(e.alternates)}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}

export function sitemapIndexXml(): string {
  const items = LOCALES.map((l) => `<sitemap><loc>${absoluteUrl(`/sitemap-${l}.xml`)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}
