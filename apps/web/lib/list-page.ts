// apps/web/lib/list-page.ts
// Shared plumbing for list pages (category/brand/scent/search). หอมฉลุย — Powered by 2T9COME.
// Parses URL search params into a validated product query, and builds ItemList/BreadcrumbList
// JSON-LD. (WP5 introduces the full lib/seo/* helpers; these are the list-page essentials.)
import { localizedPath, type Locale } from "@homchalui/i18n";
import { productListShape, type ProductCardVM } from "@homchalui/validators";
import { clientEnv } from "@homchalui/config/env";
import type { Crumb } from "@homchalui/ui";

type SearchParams = Record<string, string | string[] | undefined>;
const SITE = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Localized breadcrumb labels shared by list pages. */
export const HOME_LABEL: Record<Locale, string> = { th: "หน้าแรก", en: "Home", zh: "首页" };
export const BRAND_LABEL: Record<Locale, string> = { th: "แบรนด์", en: "Brands", zh: "品牌" };
export const SCENT_LABEL: Record<Locale, string> = { th: "กลิ่น", en: "Scents", zh: "香调" };
export const SCENT_INTRO: Record<Locale, (name: string) => string> = {
  th: (n) => `รวมของหอมในกลุ่มกลิ่น${n} — เปรียบเทียบคะแนน ความติดทน และราคา แล้วเลือกซื้อผ่านร้านที่ต้องการ`,
  en: (n) => `Scents in the ${n} family — compare scores, longevity and price, then buy at your preferred store.`,
  zh: (n) => `${n}香调合集 — 比较评分、持久度与价格，然后在你喜欢的商店购买。`,
};

/**
 * Build a validated product-list query from Next searchParams + forced overrides
 * (e.g. category/brand/scent slug). Invalid params fall back to defaults so a page never 422s.
 */
export function resolveListQuery(sp: SearchParams, overrides: Record<string, string>) {
  const obj: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) obj[k] = val;
  }
  Object.assign(obj, overrides); // forced facets win over user params
  const parsed = productListShape.safeParse(obj);
  return parsed.success ? parsed.data : productListShape.parse({ ...overrides });
}

/** BreadcrumbList JSON-LD. `crumbs[].href` is an already-localized relative path. */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE}${c.href}` } : {}),
    })),
  };
}

/** ItemList JSON-LD for a list of product cards. */
export function itemListLd(items: ProductCardVM[], locale: Locale, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE}${localizedPath(locale, `/product/${p.slug}`)}`,
    })),
  };
}

/** Serialize JSON-LD for a <script> tag. */
export function ld(...objects: unknown[]): string {
  return JSON.stringify(objects.length === 1 ? objects[0] : objects);
}

/** Build a same-page href targeting a given page number, preserving other params. */
export function withPage(sp: SearchParams, basePath: string, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val && k !== "page") params.set(k, val);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
