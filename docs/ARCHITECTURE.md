# ARCHITECTURE.md — หอมฉลุย

> Powered by 2T9COME

## 1. Style
A **modular monolith** to start. All web surfaces (front website, backoffice, public + admin
API) live in `apps/web` (Next.js App Router). Domain logic is pushed into framework-agnostic
`packages/*` so it can be extracted into a standalone service (NestJS/Fastify) later without a
rewrite. Background processing is isolated in `apps/worker`.

```
                 ┌──────────────────────────────────────────────┐
   Browsers ───▶ │  Cloudflare CDN/DNS  ──▶  Vercel (apps/web)    │
                 │   ├─ Front website (RSC, SEO/AEO, i18n)        │
                 │   ├─ Backoffice (RBAC) /admin                  │
                 │   └─ Route handlers /api/* + /go/:linkId       │
                 └───────────┬───────────────────┬───────────────┘
                             │                    │
                   ┌─────────▼───────┐   ┌────────▼─────────┐
                   │ PostgreSQL      │   │ Redis            │
                   │ (Prisma)        │   │ cache + queue    │
                   └─────────┬───────┘   └────────┬─────────┘
                             │                    │
                   ┌─────────▼────────────────────▼─────────┐
                   │ apps/worker (cron + queue consumers)    │
                   │  ranking · stats rollup · link check ·  │
                   │  sitemap · translation jobs             │
                   └─────────────────────────────────────────┘
                   Storage: Cloudflare R2/S3 (media)
                   Obs: GTM/GA4 (client) + tracking_events (server) + Sentry/Pino
```

## 2. Repo layout {#repo}
Turborepo + pnpm workspaces.

```
apps/
  web/                       # Next.js App Router
    app/
      (site)/                # Thai (default, no prefix)
        page.tsx             # Home
        product/[slug]/
        category/[slug]/
        brand/[slug]/
        scent/[slug]/
        best/[slug]/
        compare/[slug]/
        guide/[slug]/
        article/[slug]/
        layout.tsx           # site shell + <Footer> Powered by 2T9COME
      [locale]/              # en, zh (prefixed) — mirrors (site) routes
        ...
      admin/                 # backoffice (RBAC-guarded)
        dashboard/
        products/
        reviews/
        layout-builder/
        seo/
        translations/
        analytics/
        users/
      api/
        products/route.ts
        products/[slug]/route.ts
        categories/route.ts
        search/route.ts
        recommendations/route.ts
        tracking/event/route.ts
        outbound-click/route.ts
        admin/.../route.ts
      go/[linkId]/route.ts   # outbound redirect (records then 302)
      sitemap.xml/route.ts
      robots.txt/route.ts
    components/               # app-specific UI (composed from packages/ui)
    lib/                      # server services, auth, db client wiring
    middleware.ts             # locale resolution, admin guard
  worker/
    src/jobs/{ranking,stats,linkcheck,sitemap,translation}.ts
    src/scheduler.ts          # cron registration
packages/
  db/        prisma/schema.prisma · client.ts · seed.ts
  ui/        ProductCard, ProductGrid, MerchantButton, ScentProfile, ...
  config/    eslint, tsconfig, tailwind preset, env.ts (Zod)
  analytics/ dataLayer.ts, events.ts, gtm.tsx, schemas (Zod)
  ranking/   trending.ts, bestClick.ts, editorial.ts, similar.ts, personalize.ts
  i18n/      config.ts, dictionaries/{th,en,zh}.ts, hreflang.ts
  validators/ product.ts, review.ts, tracking.ts, layout.ts, seo.ts
```

## 3. Rendering & data flow
- **Server Components by default.** Client components only for filters, carousels, forms,
  language switcher, compare tray.
- Public reads go through cached service functions (Redis + Next cache tags). Writes happen
  via admin API / server actions guarded by RBAC.
- ISR/tag-based revalidation on product/category/article publish.

## 4. Outbound click flow (mandatory)
1. UI renders `MerchantButton` whose href is `/go/:linkId` (or it POSTs to
   `/api/outbound-click`).
2. The handler validates the link, records a `tracking_events` row
   (`affiliate_outbound_click`, with `locale`, product, merchant, session) and increments
   counters (Redis, flushed to `*_stats`).
3. The handler returns a **302/307 redirect** to the merchant affiliate URL.
4. Logging failures must **not** block the redirect (best-effort logging, guaranteed
   redirect).

## 5. Ranking subsystem {#ranking}
Pure functions in `packages/ranking` consume aggregated stats + admin weights from
`ranking_configs`, producing `ranking_snapshots`. The worker recomputes on schedule
(hourly trending, daily best-click/editorial). Locale-aware: trending/click/search ranking is
per-locale; editorial is global with localized display.

- `trending_score = view_24h*1 + outbound_24h*3 + detail_click_24h*2 + wishlist_24h*2 + review_engagement_24h*1.5 − bounce_penalty`
- `best_click_score = outbound_7d*4 + unique_clicker_7d*3 + merchant_link_ctr*2 + page_conversion*3`
- `editorial_score = scent*0.25 + longevity*0.2 + projection*0.15 + value*0.2 + uniqueness*0.1 + beginner*0.1`
- `similar`: attribute matching (brand, category, scent family, notes, price range, use case,
  mood, gender) with weighted Jaccard/cosine.
- `personalized`: session signals (recent categories, clicked notes, price range, merchants,
  filters); consent-gated for logged-in/cookie users.

Admin can set weights, time windows, bounce penalty, manual boost/pin, exclude-from-ranking,
recalc-now, preview, and rollback (`docs/BACKOFFICE.md`).

## 6. Caching strategy & scale
- Layers: **Cloudflare edge → Next.js ISR/cache tags → Redis → PostgreSQL**. ~70% of traffic
  is served by CDN/ISR and never reaches the app.
- Redis: hot product/category payloads, search results, ranking snapshots, outbound/view
  counters (flushed to `*_stats`), tracking-event buffer, rate limiting, sessions, job locks.
  Full breakdown in `docs/TECH_STACK.md#redis-usage-map`.
- Next.js cache tags per entity (`product:{id}`, `category:{id}`, `article:{id}`,
  `layout:{locale}`) invalidated on publish.
- Cloudflare edge cache for static/ISR pages; **never** cache the outbound redirect,
  `/api/tracking/event`, `/api/outbound-click`, or `/admin`.
- The system targets a **peak of ~1,000 req/s**: serve from cache, write asynchronously
  (buffer events, batch DB writes, precompute ranking). Capacity math, request budget, DB
  pooling/replica, rate limits, and load-test targets are in **`docs/SCALABILITY.md`**.

## 7. Failure & idempotency
- All worker jobs are idempotent and tracked in `system_jobs` with status/last-run.
- Tracking ingestion tolerates bursts (queue + batch insert).
- Migrations are forward-only with reviewed down paths.

## 8. Future extraction path
When scale demands: split the API into a Fastify/NestJS service consuming the same
`packages/*`; move search to Meilisearch/OpenSearch; move heavy analytics to a column store;
keep web on Vercel as a thin RSC/SSR layer.

---

Powered by 2T9COME
