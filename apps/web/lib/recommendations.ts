// apps/web/lib/recommendations.ts
// Similar / trending recommendations. หอมฉลุย — Powered by 2T9COME.
// Similar = attribute match (same category OR brand OR scent family), published + locale, excl self.
// Trending reuses the listing service (Redis ranking). Published-only, no Thai fallback.
import { db } from "@homchalui/db";
import type { Locale } from "@homchalui/i18n";
import { productListShape, type ProductCardVM } from "@homchalui/validators";
import { cardSelect, hydrate, badgeSignals, listProducts, type CardRow } from "./listing";

export async function getSimilar(productId: string, locale: Locale, limit = 8): Promise<ProductCardVM[]> {
  const anchor = await db.product.findUnique({
    where: { id: productId },
    select: { primaryCategoryId: true, brandId: true, scentProfile: { select: { scentFamily: true } } },
  });
  if (!anchor) return [];
  const fam = anchor.scentProfile?.scentFamily ?? null;

  const rows = await db.productTranslation.findMany({
    where: {
      locale,
      translationStatus: "published",
      productId: { not: productId },
      product: {
        status: "published",
        excludeFromRanking: false,
        OR: [
          { primaryCategoryId: anchor.primaryCategoryId },
          { brandId: anchor.brandId },
          ...(fam ? [{ scentProfile: { scentFamily: fam } }] : []),
        ],
      },
    },
    take: limit,
    orderBy: { product: { scores: { overallCached: "desc" } } },
    select: cardSelect(locale),
  });
  const signals = await badgeSignals(locale);
  return hydrate(rows as CardRow[], locale, signals);
}

export async function getTrendingRecos(locale: Locale, limit = 12): Promise<ProductCardVM[]> {
  const q = productListShape.parse({ locale, sort: "trending", limit });
  return (await listProducts(q)).items;
}
