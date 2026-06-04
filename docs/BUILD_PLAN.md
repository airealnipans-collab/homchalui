# BUILD_PLAN.md — หอมฉลุย: implementation handoff for Claude Code

> Powered by 2T9COME
> This is the **single handoff document**. The design is complete; this sequences the build.
> Read `CLAUDE.md` first and obey every rule in it. Each work package (WP) lists files to
> create, dependencies, and **acceptance criteria** (AC). Do WPs in order; within a WP, keep
> PRs small. Tick AC before moving on.

## How to use this with Claude Code
1. Open the repo; read `CLAUDE.md`, `docs/PROJECT.md`, `I18N_RULES.md`.
2. Work package by package, top to bottom. Don't skip the "already scaffolded" review.
3. For every page/feature, satisfy `CLAUDE.md §6` Definition of Done (footer, locale,
   outbound tracking, SEO, Zod, tests).
4. Reference specs: `PAGE_SPECS.md`, `COMPONENT_LIBRARY.md`, `API_CONTRACTS.md`,
   `BACKOFFICE_SPECS.md`, `DATABASE.md`, `TRACKING_EVENTS.md`, `SEO_AEO.md`, `SCALABILITY.md`.

## Status of the scaffold (already in repo)
✅ Monorepo + configs · Prisma schema + seed · `@homchalui/{config,db,i18n,redis,ranking,
validators}` · Redis helpers (cache/counter/ratelimit/lock) · `apps/web` shell (root + (site)
layout, middleware, GTM, globals) · Home + Product detail (cached, SEO/JSON-LD) ·
`/api/tracking/event` · `/go/[linkId]` · `MerchantButton`, `Footer`, `Gtm` · `apps/worker`
(drain/rollup/ranking/link-check) · k6 load test.
**Build the rest below.**

---

## Phase 1 — MVP completion

### WP1 — Foundation hardening
- Files: `packages/ui/*` (extract shared components), `apps/web/lib/session.ts` (session-id
  cookie set in middleware), `apps/web/app/robots.txt/route.ts`, base error/not-found pages.
- AC: session id is stable per visitor (cookie) and used in tracking; `robots.txt` disallows
  `/admin,/api,/go,/search`; localized 404 keeps footer.

### WP2 — Search & listing APIs
- Files: `apps/web/app/api/products/route.ts`, `apps/web/app/api/search/route.ts`,
  `apps/web/app/api/categories/route.ts`, `apps/web/lib/search.ts`, `lib/listing.ts`;
  `packages/validators/{product,query}.ts`.
- Implements `API_CONTRACTS.md` (filters, sort, pagination, published-only, locale). Search
  logs `search_query_stats` + `zero_result`. Caches via Redis.
- AC: `/api/products` returns only published-`locale` items; `sort=trending` reads
  `rank:trending:{locale}`; `/api/search` records zero-result; 422 on bad query; unit tests.

### WP3 — Category, Brand, Scent pages + shared list components
- Files: `app/(site)/category/[slug]/page.tsx`, `brand/[slug]`, `scent/[slug]`;
  `components/{CategoryFilter,SortControl,ProductGrid,ProductCard,Badge,Breadcrumb,FAQBlock}.tsx`
  (or in `packages/ui`); `lib/categories.ts`.
- Per `PAGE_SPECS.md` + `COMPONENT_LIBRARY.md`. URL-synced filters/sort.
- AC: SSR first page; filter/sort update URL; `ItemList`+`BreadcrumbList` JSON-LD; `notFound`
  on missing translation; `view_item_list`/`filter_apply`/`sort_apply` fire with `locale`.

### WP4 — Localized routing for /en and /zh
- Files: `app/[locale]/...` mirror of `(site)` routes (or unified resolver) + `app/[locale]/
  layout.tsx` (renders Footer with that locale); language-switcher wiring; `lib/locale.ts`.
- AC: `/en`, `/zh` render with correct `<html lang>` + footer; **no Thai fallback** (missing
  translation ⇒ 404/redirect to localized home, never Thai); switcher maps to equivalent
  entity; no `/th` route exists.

### WP5 — Sitemaps & SEO plumbing
- Files: `app/sitemap.xml/route.ts` (index), `app/sitemap-[locale].xml/route.ts`,
  `lib/seo/{metadata,jsonld,hreflang}.ts`; worker `sitemap` job + schedule.
- AC: per-locale sitemaps list **only published** URLs with `xhtml:link` hreflang; metadata +
  JSON-LD helpers reused by all page types; hreflang excludes unpublished locales.

### WP6 — Backoffice auth + RBAC + Product CRUD
- Files: NextAuth setup (`app/api/auth/[...nextauth]`), `lib/auth.ts`, `lib/rbac.ts`,
  middleware admin guard; `app/admin/layout.tsx`, `app/admin/dashboard`, `app/admin/products/*`,
  `app/api/admin/products/*`, `app/api/admin/merchant-links/*`; `packages/validators/admin.ts`.
- Per `BACKOFFICE_SPECS.md`. Audit log on every mutation.
- AC: only permitted roles access each route/action; product create/edit/publish works with
  per-locale translations; unique-slug + price checks; uploads validated; audit rows written;
  footer present.

### WP7 — Tracking completeness + GTM dataLayer
- Files: `packages/analytics/{events,dataLayer,gtm}.ts`; client `view_item`/`view_item_list`/
  `select_item`/`scroll_depth` wiring; GA4 config in GTM (documented).
- AC: every catalog event fires with the full envelope incl. `locale`; outbound recorded
  server-side; events validate against `packages/validators/tracking.ts`.

**Phase 1 exit:** Home, Category/Brand/Scent, Product, Search render in th/en/zh with footer;
outbound tracked; sitemaps + SEO live; backoffice product CRUD + RBAC; GTM tracking; seed demo
data. Run k6 smoke.

---

## Phase 2 — Growth
- WP8 Reviews mgmt UI + AggregateRating wiring.
- WP9 Best/Compare/Guide/Article pages + `CompareTray`, `Gallery`, `ScentProfile`.
- WP10 Layout Builder admin + `LayoutSectionRenderer` full section set.
- WP11 SEO/AEO Manager + health scores.
- WP12 Translation Management UI + workflow (draft→review→publish, outdated flagging).
- WP13 Ranking admin (weights, preview, versions, rollback) + best_click/editorial jobs.
- WP14 Merchant click analytics + similar products + advanced filters + recently viewed.
- AC per `BACKOFFICE_SPECS.md`/`PAGE_SPECS.md`; localized sitemap/hreflang verified.

## Phase 3 — Scale
- WP15 Meilisearch search. WP16 Personalization (consent-gated). WP17 Broken-link auto-checker
  dashboard + price snapshots. WP18 Affiliate performance dashboard. WP19 AI summary/review
  assistant. WP20 User accounts/wishlist + scent quiz. WP21 Read replica + partitioning per
  `SCALABILITY.md`.

---

## Global acceptance gates (every PR)
- [ ] TypeScript strict + lint + tests + build green.
- [ ] Footer `Powered by 2T9COME` on any new page.
- [ ] Locale correct; **no Thai fallback**; `locale` in every event.
- [ ] Outbound links via tracked redirect only.
- [ ] SEO metadata + JSON-LD for public pages; sitemap/hreflang exclude unpublished.
- [ ] Zod at boundaries; Prisma migrations for schema changes.
- [ ] No fake reviews; sponsored labeled; affiliate disclosure present.
- [ ] Ranking weights/merchants remain data-driven.

## Test strategy
- Unit: `packages/ranking`, `packages/validators`, i18n key parity, no-fallback rule,
  merchant-link domain allow-list.
- Component: `MerchantButton` (tracking), `ProductCard`, `LayoutSectionRenderer`,
  `LanguageSwitcher`.
- E2E (Playwright): home/category/product render per locale with footer + correct metadata;
  outbound click records then redirects; admin RBAC blocks unauthorized.
- Load: `loadtest/k6/peak-1000rps.js` against staging before launch.

---

Powered by 2T9COME
