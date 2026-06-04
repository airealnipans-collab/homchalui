# @homchalui/redis

> Powered by 2T9COME

Redis client + helpers for หอมฉลุย: read-through cache, write-absorbing counters, event
buffer, sliding-window rate limiter, and distributed locks. Every helper **degrades
gracefully** — Redis being down slows things down, it does not take the site down. See
`docs/SCALABILITY.md` and `docs/TECH_STACK.md#redis-usage-map`.

## Install
```
pnpm add @homchalui/redis   # workspace
```

## 1. Cached product read (app/product/[slug])
```ts
import { withCache, KEY } from "@homchalui/redis";
import { db } from "@homchalui/db";

export function getProduct(id: string, locale: string) {
  return withCache(
    KEY.productCache(id, locale),
    300, // 5 min TTL
    () => db.product.findUnique({ /* ...published translation only... */ }),
    [`product:${id}`], // tag for invalidation on publish
  );
}
```
On publish in the backoffice: `await invalidateTag(`product:${id}`)`.

## 2. Tracking event (POST /api/tracking/event) — returns in ~1ms
```ts
import { enqueueEvent, rateLimit } from "@homchalui/redis";
import { trackingEventSchema } from "@homchalui/validators";
import { env } from "@homchalui/config/env";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  const rl = await rateLimit("track", ip, env.RATE_LIMIT_TRACK_PER_MIN);
  if (!rl.allowed) return new Response(null, { status: 429 });

  const body = trackingEventSchema.parse(await req.json()); // Zod; `locale` REQUIRED
  await enqueueEvent({ ...body, ts: Date.now() });           // buffer; worker batch-inserts
  return new Response(null, { status: 204 });
}
```

## 3. Outbound click (GET /go/[linkId]) — record then 302, never blocked
```ts
import { incrOutbound, addUniqueClicker, enqueueEvent } from "@homchalui/redis";
import { resolveLink } from "@/lib/merchant-links";

export async function GET(req: Request, { params }: { params: { linkId: string } }) {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "th";
  const link = await resolveLink(params.linkId); // validates merchant + affiliate URL allow-list
  if (!link) return new Response("Not found", { status: 404 });

  // Best-effort logging — must not block the redirect.
  void Promise.allSettled([
    incrOutbound(link.productId, locale),
    addUniqueClicker(link.merchantId, locale, /* sessionId */ url.searchParams.get("sid") ?? "anon"),
    enqueueEvent({ event: "affiliate_outbound_click", locale, link_id: link.id,
      product_id: link.productId, merchant: link.merchantName, source_page: url.searchParams.get("src") }),
  ]);

  return Response.redirect(link.affiliateUrl, 302);
}
```

## 4. Worker: drain buffer + flush counters
```ts
import { drainEvents, takeCounter, KEY, hourBucket, withLock } from "@homchalui/redis";

await withLock("stats-rollup", 55_000, async () => {
  // 1) batch-insert buffered events
  let batch = await drainEvents(500);
  while (batch.length) { await db.trackingEvent.createMany({ data: batch.map(mapEvent) }); batch = await drainEvents(500); }
  // 2) flush hour-bucket counters into product_hourly_stats
  // (iterate known active products/locales or scan cnt:* keys)
});
```

## 5. Job lock (cron runs once across instances)
```ts
import { withLock } from "@homchalui/redis";
await withLock("ranking-recompute", 5 * 60_000, async () => { /* recompute, write rank:* + snapshots */ });
```
