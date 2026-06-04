// apps/web/lib/products.ts
// Product read service — cached, published-translation-only. หอมฉลุย — Powered by 2T9COME.
// NO Thai fallback: a product without a PUBLISHED translation in `locale` is not returned.
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";
import type { Locale } from "@homchalui/i18n";

export interface ProductDetail {
  id: string;
  brand: { name: string; slug: string };
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  mainImageUrl: string | null;
  scores: Record<string, number> | null;
  scentProfile: unknown | null;
  translation: {
    locale: Locale;
    name: string;
    slug: string;
    shortDescription: string | null;
    reviewSummary: string | null;
    pros: string[];
    cons: string[];
    bestFor: string | null;
    notFor: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    aeoSummary: string | null;
    faqItems: unknown;
    canonicalUrl: string | null;
    ogImageUrl: string | null;
  };
  merchantLinks: { id: string; merchant: string; price: number | null; go: string }[];
  rating: { value: number; count: number } | null;
}

/** Cache-key includes locale; tag enables invalidation on publish. */
export function getProductBySlug(slug: string, locale: Locale): Promise<ProductDetail | null> {
  return withCache(
    `cache:product:slug:${locale}:${slug}`,
    300,
    () => loadProductBySlug(slug, locale),
    [`product-slug:${locale}:${slug}`],
  );
}

async function loadProductBySlug(slug: string, locale: Locale): Promise<ProductDetail | null> {
  const tr = await db.productTranslation.findFirst({
    where: { locale, slug, translationStatus: "published" }, // published only — no fallback
    select: {
      locale: true, name: true, slug: true, shortDescription: true, reviewSummary: true,
      pros: true, cons: true, bestFor: true, notFor: true, seoTitle: true, seoDescription: true,
      aeoSummary: true, faqItems: true, canonicalUrl: true, ogImageUrl: true,
      product: {
        select: {
          id: true, priceMin: true, priceMax: true, currency: true, mainImageUrl: true, status: true,
          brand: { select: { translations: { where: { locale }, select: { name: true, slug: true } } } },
          scores: true,
          scentProfile: true,
          merchantLinks: {
            where: { status: "active" },
            orderBy: { priority: "asc" },
            select: { id: true, price: true, merchant: { select: { name: true } } },
          },
          reviews: { where: { locale, publishedAt: { not: null } }, select: { rating: true } },
        },
      },
    },
  });

  if (!tr || tr.product.status !== "published") return null;

  const p = tr.product;
  const ratings = p.reviews.map((r) => r.rating);
  const rating =
    ratings.length > 0
      ? { value: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)), count: ratings.length }
      : null;

  return {
    id: p.id,
    brand: { name: p.brand.translations[0]?.name ?? "", slug: p.brand.translations[0]?.slug ?? "" },
    priceMin: p.priceMin ? Number(p.priceMin) : null,
    priceMax: p.priceMax ? Number(p.priceMax) : null,
    currency: p.currency,
    mainImageUrl: p.mainImageUrl,
    scores: p.scores ? (p.scores as unknown as Record<string, number>) : null,
    scentProfile: p.scentProfile,
    translation: {
      locale: tr.locale as Locale,
      name: tr.name, slug: tr.slug, shortDescription: tr.shortDescription,
      reviewSummary: tr.reviewSummary, pros: tr.pros, cons: tr.cons,
      bestFor: tr.bestFor, notFor: tr.notFor, seoTitle: tr.seoTitle,
      seoDescription: tr.seoDescription, aeoSummary: tr.aeoSummary, faqItems: tr.faqItems,
      canonicalUrl: tr.canonicalUrl, ogImageUrl: tr.ogImageUrl,
    },
    merchantLinks: p.merchantLinks.map((l) => ({
      id: l.id,
      merchant: l.merchant.name,
      price: l.price ? Number(l.price) : null,
      go: `/go/${l.id}?locale=${locale}`, // tracked outbound — never the raw affiliate URL
    })),
    rating,
  };
}
