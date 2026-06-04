# TECH_STACK.md — หอมฉลุย

> Powered by 2T9COME

## Frontend / full-stack
- **Next.js (App Router)** + **TypeScript** — RSC by default, SSR/ISR for SEO.
- **Tailwind CSS** + **shadcn/ui** — UI system (tokens in `docs/DESIGN_SYSTEM.md`).
- **React Hook Form** + **Zod** — forms & validation.
- **TanStack Query** — only for client-driven interactive lists (infinite scroll, live filter).

## Backend
- Start as a **modular monolith**: Next.js **Route Handlers** + **Server Actions**.
- Domain logic in `packages/*` to enable later extraction to **NestJS/Fastify**.

## Data
- **PostgreSQL** + **Prisma** (migrations, typed client). Translation tables (not JSONB blobs).
  Read replica added in Phase 2 for read scaling; PgBouncer for connection pooling.
- **Redis** — central to performance. Used as cache, counters/rate-limiter, queue/buffer,
  session store, and lock manager (see "Redis usage map" below).
- **Search**: Phase 1 **Postgres full-text search**; scale to **Meilisearch** (or OpenSearch).

## Capacity target
Designed to sustain a **peak of ~1,000 requests/second** with headroom. The strategy is
"serve almost everything from cache, write asynchronously": Redis + edge/CDN cache absorb the
vast majority of reads so PostgreSQL handles only cache misses and writes. Full design,
capacity math, and load-test targets are in **`docs/SCALABILITY.md`**.

## Redis usage map (when Redis is used)
| # | Use case | Pattern / keys | TTL | Why |
|---|----------|----------------|-----|-----|
| 1 | **Read cache** for hot payloads (product detail, category listings, home layout, search results) | `cache:product:{id}:{locale}`, `cache:cat:{slug}:{locale}:{filtersHash}`, JSON value | 60–600s + tag invalidation on publish | Keep Postgres off the hot path; most reads never touch the DB |
| 2 | **Ranking/recommendation snapshots** served to the front | `rank:{key}:{locale}` (sorted set: member=productId, score), `reco:similar:{productId}:{locale}` | until next recompute | Trending/best lists are O(1) reads, not live aggregation |
| 3 | **Outbound-click & view counters** (write absorption) | `INCR cnt:outbound:{productId}:{locale}:{bucket}`, `cnt:view:...` | flushed to `*_stats` by worker, then expire | Survive 1k rps of click/track without hammering Postgres |
| 4 | **Tracking-event buffer/queue** | `LPUSH q:events` → worker `RPOP`/stream consumer, batch-insert | drained continuously | `POST /api/tracking/event` returns in ~1ms; DB writes batched |
| 5 | **Rate limiting** (public search/tracking, auth, `/go`) | sliding-window via `INCR`+`EXPIRE` or token bucket per IP/key | window length | Protect origin & DB under burst/abuse |
| 6 | **Admin session store** (NextAuth) | `sess:{id}` | session TTL | Fast, revocable sessions across instances |
| 7 | **Distributed locks** for jobs (ranking recompute, sitemap) | `SET lock:{job} nx ex=…` | job duration | Prevent duplicate cron runs across workers |
| 8 | **Dedup / idempotency** (unique clicker, idempotent event ids) | `PFADD hll:unique:{merchant}:{locale}:{date}` (HyperLogLog), `SET seen:{eventId} nx` | per-day / short | Cheap unique-clicker counts; drop duplicate events |
| 9 | **Search FTS result cache & zero-result flagging** | `cache:search:{q}:{locale}` | 60–300s | Cache repeated queries; cuts FTS load |

Run Redis as a **managed instance with persistence (AOF) + a replica**; counters that must not
be lost are flushed to Postgres rollups by the worker. If Redis is unavailable, the app
**degrades gracefully** — reads fall back to Postgres, the outbound **redirect still fires**
(logging best-effort), and rate limiting fails open with conservative limits.

## Storage
- **Cloudflare R2** (or AWS S3) for media; served via CDN; `next/image` optimization.

## Analytics & tracking
- **Google Tag Manager** + **GA4** (client) and an internal **`tracking_events`** table
  (server). Locale on every event. Outbound clicks recorded server-side.

## Logging / monitoring
- **Pino** (structured logs), **Sentry** (errors), **OpenTelemetry** (traces); logs to
  OpenSearch/Grafana stack later. Uptime via UptimeRobot / Better Stack.

## Deployment
- **Vercel** (apps/web) · **Cloudflare** (CDN/DNS) · managed **Postgres/Redis**
  (Railway/Fly.io/Render/Supabase/Neon) · **worker** host for cron/queue.

## CI/CD
- **GitHub Actions**: lint, typecheck, test, build, Prisma migrate (deploy), preview envs.

## Tooling
- **pnpm** workspaces + **Turborepo**; ESLint + Prettier; shared `packages/config` presets.

---

Powered by 2T9COME
