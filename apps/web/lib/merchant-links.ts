// apps/web/lib/merchant-links.ts
// Resolve an outbound merchant link safely. หอมฉลุย — Powered by 2T9COME.
// SECURITY: only redirect to URLs whose host matches the merchant's allow-listed base domain
// (prevents open-redirect). See docs/SECURITY.md + ADR 0004.
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";

export interface ResolvedLink {
  id: string;
  productId: string;
  merchantId: string;
  merchantName: string;
  affiliateUrl: string;
}

function hostAllowed(affiliateUrl: string, baseDomain: string | null): boolean {
  if (!baseDomain) return true; // no restriction configured
  try {
    const host = new URL(affiliateUrl).host.toLowerCase();
    const base = baseDomain.toLowerCase();
    return host === base || host.endsWith(`.${base}`);
  } catch {
    return false;
  }
}

/** Cached lookup of a merchant link by id, with domain allow-list validation. */
export async function resolveLink(linkId: string): Promise<ResolvedLink | null> {
  const link = await withCache(
    `cache:link:${linkId}`,
    300,
    async () => {
      const row = await db.productMerchantLink.findFirst({
        where: { id: linkId, status: "active" },
        select: {
          id: true,
          productId: true,
          merchantId: true,
          affiliateUrl: true,
          merchant: { select: { name: true, baseDomain: true, isActive: true } },
        },
      });
      if (!row || !row.merchant.isActive) return null;
      if (!hostAllowed(row.affiliateUrl, row.merchant.baseDomain)) return null;
      return {
        id: row.id,
        productId: row.productId,
        merchantId: row.merchantId,
        merchantName: row.merchant.name,
        affiliateUrl: row.affiliateUrl,
      } satisfies ResolvedLink;
    },
    [`link:${linkId}`],
  );
  return link;
}
