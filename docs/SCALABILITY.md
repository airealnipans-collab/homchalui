# SCALABILITY.md — หอมฉลุย: Designing for 1,000 req/s peak

> Powered by 2T9COME
> Target: sustain a **peak of ~1,000 requests/second** with headroom (design for ~1,500–2,000
> rps burst). Core idea: **serve almost everything from cache, write asynchronously.** Redis +
> CDN absorb reads; PostgreSQL only handles cache misses and durable writes.
> Companion: `docs/TECH_STACK.md` (Redis usage map), `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`.

## 1. Request mix & budget (assumed)
A review-commerce site is **read-heavy**. Assume of 1,000 rps:

| Traffic class | Share | ~rps | Primary path |
|---------------|-------|------|--------------|
| Static/ISR HTML + assets (home, product, category, article) | ~70% | ~700 | **Cloudflare CDN / Next ISR** (origin rarely touched) |
| Dynamic API reads (search, filtered listings, recommendations) | ~18% | ~180 | App → **Redis cache** → Postgres on miss |
| Tracking events (`/api/tracking/event`) | ~8% | ~80 | App → **Redis buffer** → batched DB writes |
| Outbound clicks (`/go/:linkId`) | ~3% | ~30 | App → Redis counter (best-effort) → **302 redirect** |
| Admin/backoffice | <1% | ~5 | App → Postgres (low volume, RBAC) |

Design implication: **~700 rps never reaches the app**, ~180 rps is cache-hit-dominated, and
the only synchronous DB writes (~30–80 rps of clicks/events) are buffered. Postgres sees well
under ~100 rps of real queries at peak.

## 2. Caching layers (defense in depth)
```
Browser → Cloudflare edge (CDN) → Next.js (ISR / RSC + cache tags) → Redis → PostgreSQL
            ^ 70% served here        ^ HTML cached/revalidated        ^ data cache   ^ source of truth
```
1. **CDN/edge (Cloudflare):** static assets + cacheable HTML (home, product, category, article,
   guide). Long TTL for assets (immutable, hashed). Stale-while-revalidate for pages.
2. **Next.js ISR + cache tags:** server-rendered pages cached and revalidated on publish via
   tags `product:{id}`, `category:{id}`, `article:{id}`, `layout:{locale}`. The outbound
   redirect and personalized/admin responses are **never** cached.
3. **Redis data cache:** product/category/listing/search JSON + ranking snapshots (see Redis
   usage map). TTL 60–600s + explicit invalidation on publish. Target **>90% hit ratio** on
   hot reads.
4. **PostgreSQL:** authoritative store; only cache misses + writes.

**Never cache:** `/go/:linkId`, `/api/outbound-click`, `/api/tracking/event`, anything under
`/admin`, and per-session personalized responses.

## 3. Write path (absorb bursts, protect Postgres)
- **Tracking events:** `POST /api/tracking/event` validates (Zod) then `LPUSH q:events` and
  returns 204 in ~1ms. The worker drains the list/stream and **batch-inserts** (e.g., 500 rows
  / COPY) into `tracking_events`. No per-event synchronous DB round-trip.
- **Counters:** clicks/views `INCR` Redis keys per `(productId, locale, hour-bucket)`; the
  **stats rollup** job flushes to `product_hourly_stats` / `merchant_click_stats`, then keys
  expire. Unique clickers via Redis **HyperLogLog** (`PFADD`).
- **Outbound redirect:** record best-effort (counter + enqueue server-side event), then issue
  302/307. **Logging failure must never block the redirect** (ADR 0004).

## 4. Read path
- Public reads hit Redis first (`cache:*`); on miss, query Postgres (published translations
  only), then `SET` with TTL + tag membership for invalidation.
- **Ranking/trending/recommendations** are precomputed by the worker into Redis sorted sets
  (`rank:{key}:{locale}`) and `ranking_snapshots`; the front reads them directly — no live
  aggregation on the request path.
- **Search** (Phase 1 Postgres FTS) results cached per `(q, locale)`; repeated/zero-result
  queries are cheap. Migrate to **Meilisearch** when query volume or latency demands.

## 5. Rate limiting & abuse control (Redis)
- Per-IP sliding window on `search`, `tracking/event`, `/go`, and auth endpoints; per-user
  limits on admin. Token-bucket/`INCR+EXPIRE` keys. Cloudflare WAF/Bot rules in front.
- **Fail-open** for rate limiting if Redis is down (apply a conservative static cap), but keep
  the redirect and read fallbacks working.

## 6. Connection pooling & DB sizing
- **PgBouncer** (transaction pooling) in front of Postgres; Prisma points at the pooler.
  Serverless/edge instances must not open one connection each — pooling is mandatory.
- Add a **read replica** (Phase 2): route cacheable/heavy reads to the replica, writes to
  primary. Accept slight replica lag for non-critical reads.
- Index discipline per `docs/DATABASE.md` (FKs, `(entity_id, locale)`, partial `published`
  indexes). Keep `tracking_events` lean: partition by month and/or move to a rollup-first model
  so the hot table stays small.

## 7. Compute / horizontal scaling
- `apps/web` is **stateless** (sessions in Redis) → scale horizontally behind the platform's
  autoscaler (Vercel functions / containers). At ~180 rps of dynamic work with cache hits,
  a handful of instances suffice; autoscale on CPU/concurrency.
- `apps/worker` scales independently for queue drain + rollups; use distributed locks
  (`lock:{job}`) so cron jobs run once.
- Redis: managed, AOF persistence + replica; size for working set (hot products + counters +
  snapshots). Shard/cluster only if a single node's memory/throughput is exceeded.

## 8. Latency & resilience budgets
- p95 cached read < 100ms; p95 miss < 300ms; tracking ingest < 10ms (enqueue only); redirect
  < 50ms.
- **Graceful degradation:** Redis down → reads fall back to Postgres, redirect still fires,
  rate-limit fails open. Postgres replica down → reads go to primary. CDN handles origin blips
  via stale-while-revalidate.
- Backpressure: if `q:events` grows, shed lowest-value events first (e.g., `scroll_depth`)
  before business-critical `affiliate_outbound_click`.

## 9. Capacity math (sanity check)
- 1,000 rps × 86,400s ≈ **86M requests/day**; at 70% CDN offload, origin sees ~26M/day
  (~300 rps avg, 1,000 rps peak).
- At 90% Redis hit ratio on ~180 rps dynamic reads → ~18 rps to Postgres reads + ~30–80 rps
  buffered writes (batched to a few inserts/sec). A single well-tuned Postgres primary +
  pooler + replica handles this comfortably.
- Redis at ~300–1,000 ops/sec for counters/cache lookups is trivial for one managed node.

## 10. Load testing & rollout
- **k6 / Artillery** scenarios mirroring the traffic mix above; target 1,000 rps sustained +
  1,500 rps burst for 10 min. Assert p95 latencies and error rate < 0.1%.
- Verify cache hit ratio, Redis memory, PgBouncer saturation, queue depth, and that
  `affiliate_outbound_click` counts reconcile between Redis counters and `*_stats`.
- Gate releases on a staging load test; watch Sentry/OTel dashboards on production ramp.

---

Powered by 2T9COME
