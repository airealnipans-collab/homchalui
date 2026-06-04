# ROADMAP.md — หอมฉลุย

> Powered by 2T9COME

## Phase 1 — MVP
Home page · category page · product detail · product card · merchant outbound links (tracked)
· basic search (Postgres FTS) · backoffice product CRUD · SEO metadata · sitemap · GTM · basic
tracking · multilingual structure th/en/zh (routing + translation tables) · footer
`Powered by 2T9COME`.

## Phase 2 — Growth
Ranking algorithms (trending / best-click / editorial) · product stats rollups · trending
section · layout builder · FAQ/AEO manager · merchant click analytics · similar products ·
advanced filters · translation management · localized sitemap + hreflang.

## Phase 3 — Scale
Personalization · dedicated search engine (Meilisearch/OpenSearch) · auto broken-link checker
· price tracking/snapshots · affiliate performance dashboard · content workflow · AI
summary/review assistant · multi-language expansion · user accounts/wishlist · scent quiz ·
product comparison.

## Additional recommendations (slot across phases)
Compare products (P2/P3) · scent quiz (P3) · wishlist (P3) · recently viewed (P2) · broken-link
checker (P3, basic flag P2) · price snapshot (P3) · campaign landing pages (P2) · affiliate
disclosure (P1) · editorial trust system (P2) · content completeness score (P1/P2) · product
completeness score (P1) · translation completeness score (P2) · SEO health score (P2) · search
zero-result analytics (P2) · merchant performance dashboard (P3).

## Implementation Checklist {#implementation-checklist}

### Foundation
- [ ] Turborepo + pnpm workspaces; `packages/{db,ui,config,analytics,ranking,i18n,validators}`.
- [ ] `docker-compose` (postgres + redis); `.env` from `.env.example` (Zod-validated).
- [ ] Prisma schema + first migration + seed (locales, roles, merchants, demo data).
- [ ] `packages/i18n` config; middleware locale routing (th no-prefix, /en, /zh; no /th).
- [ ] Global shell + Footer `Powered by 2T9COME` + LanguageSwitcher.

### Front website (P1)
- [ ] Home with LayoutSectionRenderer; Category (filter/sort/SEO/FAQ/breadcrumb); Product detail.
- [ ] ProductCard, ProductGrid, ProductCarousel, MerchantButton, ScentProfile, RatingBreakdown.
- [ ] `/go/:linkId` outbound redirect (record → 302); MerchantButton uses it.
- [ ] generateMetadata (title/description/canonical/OG/hreflang) + JSON-LD per page type.
- [ ] sitemap index + per-locale sitemaps + robots.txt.

### Tracking (P1)
- [ ] GTM + dataLayer contract; event catalog implemented (locale on every event).
- [ ] `POST /api/tracking/event` ingestion (+ Redis buffer); server-side outbound logging.

### Backoffice (P1→P2)
- [ ] Auth (NextAuth) + RBAC + audit log; roles/permissions seeded.
- [ ] Product CRUD (all field groups) + merchant link mgmt + completeness score.
- [ ] Review management (tested/sponsored flags).
- [ ] Dashboard; SEO manager; Layout builder; Translation management; Analytics; Ranking settings.

### Ranking & jobs (P2)
- [ ] `packages/ranking` pure functions + unit tests; `ranking_configs` versioned.
- [ ] `apps/worker`: ranking recompute, stats rollup, link checker, sitemap, translation jobs.

### Quality gates (every PR)
- [ ] Lint + typecheck + tests + build green; `CLAUDE.md §6` Definition of Done satisfied.
- [ ] Footer present; outbound tracked; locale correct; no Thai fallback; no fake reviews.

---

Powered by 2T9COME
