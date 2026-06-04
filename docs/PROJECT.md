# PROJECT.md — หอมฉลุย Master Design Document

> Powered by 2T9COME
> This is the executive map of the whole project. Each numbered section below corresponds to
> the original design brief; deep detail lives in the linked docs.

## 1. Executive Summary

หอมฉลุย (Homchalui) is a **Review Commerce Platform** for fragrance & home-scent products.
It deliberately mimics the UX of marketplaces like Shopee/Lazada/Central/Amazon — product
cards, categories, filters, sort, ranking, badges, rich product pages — so users feel like
they are shopping. But it **does not sell anything itself**. Its job is to help people pick
the right scent product, then route them to an external merchant through a **tracked
affiliate link**. Monetization is affiliate-based; the key success metric is the
**outbound click** (a proxy for sales) rather than internal transactions.

The platform ships with a full **backoffice** (product CMS, review management, layout
builder, SEO/AEO manager, translation management, analytics, RBAC), strong **SEO/AEO**, full
**tracking/analytics via GTM + GA4 + an internal events store**, and is **trilingual**
(`th` default with no URL prefix, `en` at `/en`, `zh` at `/zh`) with strict no-fallback
localization rules. Every page carries the footer **`Powered by 2T9COME`**.

## 2. Product Definition
See `docs/PRODUCT_REQUIREMENTS.md`. In short: a fragrance review/comparison site with
e-commerce ergonomics and affiliate outbound. Categories: perfume (men/women/unisex), scented
candle, incense, room spray, bathroom fragrance, car fragrance, home fragrance, misc scent
goods. Core jobs-to-be-done: discover → compare → trust → click out to buy.

## 3. Business Model
Affiliate / review-commerce. Revenue = affiliate commissions from Shopee, Lazada, Central,
Amazon, TikTok Shop, official stores, and custom merchants. No first-party inventory,
checkout, or payments in Phase 1–2. **Outbound clicks** and **merchant CTR** are the primary
business KPIs; editorial trust and content completeness protect long-term SEO value.
Details in `docs/PRODUCT_REQUIREMENTS.md` and `docs/ANALYTICS.md`.

## 4. System Overview
Two sides: **Front Website** (discovery + reviews + outbound) and **Backoffice** (CMS +
analytics + control center). Modular monolith in `apps/web` (Next.js App Router) backed by
PostgreSQL/Prisma + Redis; background jobs in `apps/worker`. Full picture in
`docs/ARCHITECTURE.md`.

## 5. Front Website Requirements
Home, Category, Product Detail, Product Card, Brand/Scent/Best/Compare/Guide/Article pages,
multi-merchant buy buttons (tracked), mobile-first performance. See `docs/FRONTEND.md`.

## 6. Backoffice Requirements
Dashboard, Product Management, Review Management, Layout Builder, SEO/AEO Manager, Translation
Management, RBAC + audit log. See `docs/BACKOFFICE.md`.

## 7. Multilingual / i18n Requirements
`th`/`en`/`zh`, Thai default no-prefix, no Thai fallback, per-locale slugs, translation tables,
translation lifecycle, hreflang/localized sitemaps. See `I18N_RULES.md` +
`docs/INTERNATIONALIZATION.md`, `docs/MULTILINGUAL_SEO.md`, `docs/TRANSLATION_WORKFLOW.md`,
`docs/LOCALE_CONTENT_RULES.md`.

## 8. SEO / AEO Requirements
Page-type taxonomy, full metadata, JSON-LD, AEO answer blocks, FAQ, structured data, sitemaps,
robots. See `docs/SEO_AEO.md`.

## 9. Tracking / Analytics Requirements
GTM + GA4 + internal `tracking_events`. Defined dataLayer + event catalog, locale on every
event, outbound-click-before-redirect. See `docs/TRACKING_EVENTS.md` + `docs/ANALYTICS.md`.

## 10. Ranking / Recommendation Algorithm
Trending score, best-click (sales proxy), editorial score, similar product, personalized
recs; admin-tunable weights; locale-aware; recomputed hourly/daily by the worker. See
`docs/ARCHITECTURE.md#ranking` and `packages/ranking`.

## 11. Database Design
PostgreSQL + Prisma; translation tables (not JSONB blobs); analytics rollups; ranking config &
snapshots. See `docs/DATABASE.md` + `packages/db/prisma/schema.prisma`.

## 12. API Design
Public API (products, categories, search, recommendations, tracking, outbound-click) + Admin
API (CRUD, layout, SEO, analytics, ranking, translations). Locale-aware. See `docs/API.md`.

## 13. Tech Stack
Next.js App Router, TypeScript, Tailwind + shadcn/ui, RHF + Zod, Postgres + Prisma, Redis,
Postgres FTS → Meilisearch, R2/S3, GTM/GA4, Pino/Sentry, Vercel + Cloudflare, GitHub Actions.
See `docs/TECH_STACK.md`.

## 14. Project Folder Structure
Turborepo monorepo: `apps/web`, `apps/worker`, `packages/{db,ui,config,analytics,ranking,
i18n,validators}`, `docs`, `prompts`, `examples`. See `docs/ARCHITECTURE.md#repo` and README.

## 15. AI Skill / Docs Structure
`CLAUDE.md`, `SKILL.md`, `I18N_RULES.md`, the `docs/*` set, `docs/decisions/*` ADRs,
`prompts/*`, `examples/*`. See `docs/AI_RULES.md`.

## 16. Draft content for key files
`CLAUDE.md`, `SKILL.md`, `I18N_RULES.md` are written in full at the repo root. Key docs in this
folder are written in full; remaining docs are scaffolded with outlines to be expanded.

## 17. UX/UI Direction
Clean, fragrant, soft-premium, trustworthy, shopping-like. Palette: cream/ivory, soft gold,
pastel pink, lavender, deep brown, charcoal. Component library listed in
`docs/DESIGN_SYSTEM.md`.

## 18. Security
Admin auth + RBAC + (2FA), CSRF, rate limiting, audit log, input/upload validation, XSS
protection, secure affiliate redirect, secret management, backups. See `docs/SECURITY.md`.

## 19. Logging / Monitoring
Pino structured logs, Sentry errors, uptime monitoring, OpenTelemetry traces, job status in
`system_jobs`. See `docs/DEPLOYMENT.md`.

## 20. Deployment / DevOps
Vercel (web) + Cloudflare (CDN/DNS) + managed Postgres/Redis + worker host; GitHub Actions
CI/CD; Prisma migrations; cron jobs (ranking, stats, link check, sitemap). See
`docs/DEPLOYMENT.md`.

## 21. Roadmap
Phase 1 MVP → Phase 2 Growth → Phase 3 Scale. See `docs/ROADMAP.md`.

## 22. Additional Recommendations
Compare, scent quiz, wishlist, recently viewed, broken-link checker, price snapshot, campaign
landing pages, affiliate disclosure, editorial trust system, content/SEO/translation health
scores, zero-result search analytics, merchant performance dashboard. See `docs/ROADMAP.md`
and `docs/PRODUCT_REQUIREMENTS.md`.

## 23. Implementation Checklist
See `docs/ROADMAP.md#implementation-checklist`.

---

Powered by 2T9COME
