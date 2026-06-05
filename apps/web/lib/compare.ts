// apps/web/lib/compare.ts
// Compare data — side-by-side product VMs. หอมฉลุย — Powered by 2T9COME.
// Published-translation-only + locale (no Thai fallback). 2–4 products; preserves the input order.
import { db } from "@homchalui/db";
import { localizedPath, type Locale } from "@homchalui/i18n";

export interface CompareProduct {
  id: string;
  slug: string;
  href: string;
  name: string;
  brand: string;
  image: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  rating: { value: number; count: number } | null;
  scores: Record<string, number> | null;
  scentFamily: string | null;
  notes: string[];
  merchantMinPrice: number | null;
  pros: string[];
  cons: string[];
}

export const COMPARE_MAX = 4;

export async function getCompareProducts(ids: string[], locale: Locale): Promise<CompareProduct[]> {
  const wanted = [...new Set(ids)].slice(0, COMPARE_MAX);
  if (wanted.length === 0) return [];

  const rows = await db.productTranslation.findMany({
    where: { locale, translationStatus: "published", productId: { in: wanted }, product: { status: "published" } },
    select: {
      name: true, slug: true, pros: true, cons: true,
      product: {
        select: {
          id: true, priceMin: true, priceMax: true, currency: true, mainImageUrl: true,
          brand: { select: { translations: { where: { locale }, select: { name: true } } } },
          scores: true,
          scentProfile: { select: { scentFamily: true, topNotes: true, middleNotes: true, baseNotes: true } },
          merchantLinks: { where: { status: "active" }, select: { price: true } },
          reviews: { where: { locale, publishedAt: { not: null } }, select: { rating: true } },
        },
      },
    },
  });

  const byId = new Map(
    rows.map((r) => {
      const p = r.product;
      const ratings = p.reviews.map((x) => x.rating);
      const prices = p.merchantLinks.map((l) => (l.price ? Number(l.price) : null)).filter((x): x is number => x != null);
      const sp = p.scentProfile;
      return [
        p.id,
        {
          id: p.id,
          slug: r.slug,
          href: localizedPath(locale, `/product/${r.slug}`),
          name: r.name,
          brand: p.brand.translations[0]?.name ?? "",
          image: p.mainImageUrl,
          priceMin: p.priceMin ? Number(p.priceMin) : null,
          priceMax: p.priceMax ? Number(p.priceMax) : null,
          currency: p.currency,
          rating:
            ratings.length > 0
              ? { value: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)), count: ratings.length }
              : null,
          scores: p.scores ? (p.scores as unknown as Record<string, number>) : null,
          scentFamily: sp?.scentFamily ?? null,
          notes: sp ? [...sp.topNotes, ...sp.middleNotes, ...sp.baseNotes] : [],
          merchantMinPrice: prices.length ? Math.min(...prices) : null,
          pros: r.pros,
          cons: r.cons,
        } satisfies CompareProduct,
      ];
    }),
  );

  // Preserve requested order.
  return wanted.map((id) => byId.get(id)).filter((x): x is CompareProduct => x != null);
}
