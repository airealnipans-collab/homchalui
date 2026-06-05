// apps/web/lib/seo/jsonld.ts
// Shared JSON-LD builders, reused by every public page type. หอมฉลุย — Powered by 2T9COME.
import { localizedPath, type Locale } from "@homchalui/i18n";
import type { ProductCardVM } from "@homchalui/validators";
import { absoluteUrl } from "./hreflang";

export interface Crumb {
  label: string;
  href?: string; // already-localized relative path
}

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

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
      url: absoluteUrl(localizedPath(locale, `/product/${p.slug}`)),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export interface ProductLdInput {
  name: string;
  brandName: string;
  image?: string | null;
  description?: string | null;
  locale: Locale;
  currency: string;
  priceMin: number | null;
  priceMax: number | null;
  offerCount: number;
  rating: { value: number; count: number } | null;
}

export function productLd(p: ProductLdInput) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brandName },
    image: p.image ?? undefined,
    description: p.description ?? undefined,
    inLanguage: p.locale,
  };
  if (p.priceMin != null) {
    node.offers = {
      "@type": "AggregateOffer",
      priceCurrency: p.currency,
      lowPrice: p.priceMin,
      highPrice: p.priceMax ?? p.priceMin,
      offerCount: p.offerCount,
    };
  }
  if (p.rating) {
    node.aggregateRating = { "@type": "AggregateRating", ratingValue: p.rating.value, reviewCount: p.rating.count };
  }
  return node;
}

export function articleLd(input: {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  locale: Locale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    inLanguage: input.locale,
    mainEntityOfPage: input.url,
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "หอมฉลุย",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/production_logo/logo-icon.png"),
  };
}

/** Serialize one or more JSON-LD objects for a <script type="application/ld+json"> tag. */
export function ld(...objects: unknown[]): string {
  return JSON.stringify(objects.length === 1 ? objects[0] : objects);
}
