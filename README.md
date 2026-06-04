# หอมฉลุย (Homchalui) — Review Commerce Platform

> Powered by 2T9COME

**หอมฉลุย** is a **Review Commerce Platform** for fragrance & home-scent products
(perfume, scented candles, incense, room sprays, car fragrance, home fragrance, etc.).
It **looks and feels like an e-commerce marketplace** (Shopee / Lazada / Central / Amazon)
— product cards, categories, filters, sort, ranking, badges, product detail pages —
but it **does not sell anything directly**. Instead it helps users decide what to buy,
then sends them out to a merchant via a **tracked affiliate outbound link**.

> เว็บนี้ "หน้าตาเหมือนเว็บช้อปปิ้ง" แต่จริง ๆ คือเว็บรีวิว + เปรียบเทียบ + ส่งออกไปซื้อผ่าน merchant
> ไม่มี checkout ของตัวเองในช่วงแรก

---

## ⚠️ Non-negotiable project rules

These are **permanent requirements**. Do not remove or contradict them. See `CLAUDE.md`.

1. **Footer on every page must read `Powered by 2T9COME`.**
2. This is **review-commerce / affiliate**, NOT a first-party store. No own checkout (Phase 1–2).
3. **Outbound clicks must hit an internal tracking API before redirecting** to the merchant.
4. **3 locales**: `th` (default), `en`, `zh`. Thai has **no URL prefix**; English uses `/en`; Chinese uses `/zh`.
5. **No fallback of Thai content into `/en` or `/zh` pages.** Untranslated localized pages are not published/indexed.
6. **Every tracking event must carry `locale`.**
7. **No fake reviews.** Never claim a product was personally tested unless it is marked `tested`. Sponsored content is clearly labeled.

---

## Monorepo layout

```
homchalui/
├── apps/
│   ├── web/        # Next.js App Router (front website + backoffice + API)
│   └── worker/     # cron/queue jobs: ranking, stats rollup, link checker, sitemap
├── packages/
│   ├── db/         # Prisma schema + client + migrations + seed
│   ├── ui/         # shared React components (shadcn/ui based)
│   ├── config/     # eslint/tsconfig/tailwind presets + locale config
│   ├── analytics/  # dataLayer helpers, GTM events, event schemas (Zod)
│   ├── ranking/    # scoring algorithms (trending, best-click, editorial, similar)
│   ├── i18n/       # locale config, dictionaries, hreflang/canonical helpers
│   └── validators/ # shared Zod schemas (product, review, tracking, layout, seo)
├── docs/           # design docs (read these first) + decisions/ (ADRs)
├── prompts/        # role prompts for AI assistants
├── examples/       # canonical JSON examples (product, tracking-event, layout, ...)
├── docker-compose.yml   # local Postgres + Redis (+ Meilisearch later)
├── package.json
├── turbo.json
└── README.md
```

## Tech stack (summary)

Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · React Hook Form + Zod ·
PostgreSQL + Prisma · Redis · Postgres FTS → Meilisearch (later) · Cloudflare R2/S3 ·
GTM + GA4 + internal `tracking_events` · Pino + Sentry · Vercel + Cloudflare · GitHub Actions.

Full detail in [`docs/TECH_STACK.md`](docs/TECH_STACK.md).

## Where to start

- **Read first:** [`CLAUDE.md`](CLAUDE.md), [`docs/PROJECT.md`](docs/PROJECT.md), [`I18N_RULES.md`](I18N_RULES.md)
- **Build the front:** [`docs/FRONTEND.md`](docs/FRONTEND.md), [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- **Build the backoffice:** [`docs/BACKOFFICE.md`](docs/BACKOFFICE.md)
- **Data model:** [`docs/DATABASE.md`](docs/DATABASE.md) + `packages/db/prisma/schema.prisma`
- **APIs:** [`docs/API.md`](docs/API.md)
- **Tracking:** [`docs/TRACKING_EVENTS.md`](docs/TRACKING_EVENTS.md)
- **SEO/AEO:** [`docs/SEO_AEO.md`](docs/SEO_AEO.md)
- **Roadmap:** [`docs/ROADMAP.md`](docs/ROADMAP.md)

## ▶️ Design is complete — build handoff for Claude Code

The design phase is finished. To implement, start here and follow it package by package:

- **🏗️ [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md)** — ordered work packages + acceptance criteria (read first)
- **Pages:** [`docs/PAGE_SPECS.md`](docs/PAGE_SPECS.md) — every route fully specified
- **Components:** [`docs/COMPONENT_LIBRARY.md`](docs/COMPONENT_LIBRARY.md) — props/contracts
- **API I/O:** [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) — request/response schemas
- **Backoffice:** [`docs/BACKOFFICE_SPECS.md`](docs/BACKOFFICE_SPECS.md) — screen-by-screen
- **UI mockups:** [`docs/UI_MOCKUPS.md`](docs/UI_MOCKUPS.md) — every screen, theme tokens, build notes
- **Scalability:** [`docs/SCALABILITY.md`](docs/SCALABILITY.md) — 1,000 req/s design

## Local dev (target)

```bash
pnpm install
docker compose up -d            # postgres + redis
pnpm --filter @homchalui/db migrate:dev
pnpm --filter @homchalui/db seed
pnpm dev                        # turbo run dev -> apps/web on :3000
```

---

Powered by 2T9COME
