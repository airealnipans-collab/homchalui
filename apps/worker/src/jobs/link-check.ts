// apps/worker/src/jobs/link-check.ts
// Check active merchant links and mark broken ones. หอมฉลุย — Powered by 2T9COME.
// Broken links are flagged (status='broken') so the front excludes them from offers and the
// backoffice surfaces them. Runs daily. Conservative: only mark broken on clear failures.
import { db } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";

async function isReachable(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    // Some merchants reject HEAD; fall back to GET without downloading the body fully.
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
    }
    clearTimeout(t);
    return res.status < 400;
  } catch {
    return false;
  }
}

export async function linkCheckJob(limit = 500): Promise<{ checked: number; broken: number }> {
  const links = await db.productMerchantLink.findMany({
    where: { status: { in: ["active", "broken"] } },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
    take: limit,
    select: { id: true, affiliateUrl: true, productId: true, status: true },
  });

  let broken = 0;
  for (const l of links) {
    const ok = await isReachable(l.affiliateUrl);
    const nextStatus = ok ? "active" : "broken";
    // Always record the check time; status flips to active/broken based on reachability.
    await db.productMerchantLink.update({
      where: { id: l.id },
      data: { status: nextStatus, lastCheckedAt: new Date() },
    });
    if (!ok) {
      broken++;
      // Invalidate caches that depend on this link / its product.
      await invalidateTag(`link:${l.id}`);
    }
  }
  console.log(`[link-check] checked=${links.length} broken=${broken}`);
  return { checked: links.length, broken };
}
