# CLAUDE.md — Operating rules for AI coding agents

This file is the **source of truth** for any AI coding assistant (Claude Code, Cowork,
Cursor, Windsurf, ChatGPT, etc.) working in this repository. Read it fully before writing
code. If a request conflicts with this file, **follow this file** and flag the conflict.

---

## 1. What this project is

**หอมฉลุย (Homchalui)** is a **Review Commerce Platform** for fragrance / home-scent
products. It presents products with an e-commerce UX (cards, categories, filters, sort,
ranking, badges, product detail), but it is **NOT a store**.

- ❌ It does **not** sell products itself. There is **no own checkout, cart, or payment**
  in Phase 1–2.
- ✅ It publishes **reviews, comparisons, scent profiles, scores, and buying guides**, then
  routes users to external merchants (Shopee, Lazada, Central, Amazon, TikTok Shop, official
  sites, custom merchants) via **affiliate / merchant links**.
- ✅ Business model = **affiliate / review-commerce**. Revenue proxy = **outbound clicks**,
  not internal sales.
- ✅ It is a **responsive website** (Next.js), **not** a native mobile app. One codebase, one
  URL, **mobile-first** but works on all devices — phone, tablet, desktop. Designs are drawn
  phone-first; on wider screens the same pages reflow (e.g. bottom nav → top nav, 2-col grid →
  4–5-col grid). See `docs/FRONTEND.md` §Responsive.

> If you ever find yourself building a cart, checkout, payment, or inventory system, or a
> native app, **stop** — that is out of scope and contradicts the model.

---

## 2. Permanent, non-negotiable rules

1. **Footer `Powered by 2T9COME` on EVERY page** (front + backoffice), all locales. Never
   remove it. Treat it as a hard test assertion.
2. **Outbound click flow is mandatory:** user clicks "Buy via X" → frontend calls
   `POST /api/outbound-click` (or `GET /go/:linkId`) → backend records the event → backend
   issues a redirect (302/307) to the affiliate URL. **Never** render the raw affiliate URL
   as a direct `<a href>` that bypasses tracking.
3. **Locales = `th` (default), `en`, `zh`.**
   - Thai = default, **no URL prefix**: `/`, `/product/[slug]`, `/category/[slug]`.
   - English = `/en/...`. Chinese = `/zh/...`.
   - Do **not** create a `/th` prefix.
4. **No Thai-content fallback into `/en` or `/zh`.** If a localized translation is missing,
   the localized page is **not published and not indexed** (`noindex` or 404/redirect to the
   localized category/home, never silently show Thai text).
5. **Every tracking event includes `locale`.** No exceptions.
6. **Content integrity:** no fake reviews; never claim "tested" unless the review is marked
   `tested = true`; sponsored content must be visibly labeled and stored with
   `sponsored = true`.
7. **Affiliate disclosure** must be present where affiliate links appear (per locale).

---

## 3. Tech & code conventions

- **Language:** TypeScript everywhere. `strict: true`. No `any` (use `unknown` + narrowing).
- **Framework:** Next.js **App Router**. **Server Components by default**; add
  `"use client"` only when interactivity/browser APIs are required (forms, filters,
  carousels, language switcher).
- **Validation:** **Zod** for every external boundary — API input/output, env vars, form
  data, tracking payloads, layout-section configs. Shared schemas live in
  `packages/validators`.
- **DB:** **PostgreSQL** via **Prisma**. All schema changes go through Prisma migrations.
  Never write raw destructive SQL in app code.
- **Forms:** React Hook Form + Zod resolver.
- **Styling:** Tailwind + shadcn/ui. Use design tokens from `docs/DESIGN_SYSTEM.md`; do not
  hardcode brand colors ad hoc.
- **Data fetching:** prefer server components / server actions; use TanStack Query only for
  genuinely client-driven interactive lists.
- **i18n:** never hardcode user-facing strings; pull from `packages/i18n` dictionaries.
- **IDs/slugs:** slugs are **per-locale** (stored in `*_translations`). Never reuse a Thai
  slug for `/en` or `/zh`.

## 4. Architecture rules

- Start as a **modular monolith** inside `apps/web` (front + backoffice + API routes), with
  domain logic in `packages/*` so a future extraction to NestJS/Fastify is clean.
- Long-running / scheduled work (ranking recompute, stats rollup, link checker, sitemap) runs
  in `apps/worker`, **never** inline in a request handler.
- Keep ranking math in `packages/ranking` (pure functions, unit-tested). Weights come from
  `ranking_configs` in the DB, not hardcoded.
- Analytics/event definitions live in `packages/analytics`; do not invent event names inline.

## 5. SEO / AEO rules

- Every public page type (`/product`, `/category`, `/brand`, `/scent`, `/best`, `/compare`,
  `/guide`, `/article`) must emit: title, meta description, canonical, OG, Twitter card,
  breadcrumb, JSON-LD, and `hreflang` for the locales that actually have a published
  translation only.
- JSON-LD types: Product, Review, AggregateRating, FAQPage, BreadcrumbList, ItemList,
  Organization, Article — as applicable.
- Each key page carries an **AEO block**: 3–5 line summary, FAQ, "best for / not for",
  approximate price, where to buy, pros/cons.
- Do not emit `hreflang`/sitemap entries for unpublished/untranslated localized pages.

## 6. Definition of done (for any feature)

- [ ] TypeScript strict passes, lint passes.
- [ ] Zod validation on all new boundaries.
- [ ] Footer `Powered by 2T9COME` present on any new page.
- [ ] Locale handled correctly (no Thai fallback; `locale` in every event).
- [ ] Outbound links go through the tracking redirect.
- [ ] SEO metadata + JSON-LD present for public pages.
- [ ] Unit tests for ranking/algorithm/validator changes.
- [ ] No fake reviews / unmarked sponsored content introduced.

## 7. Things to never do

- Never build first-party checkout/payment/cart.
- Never bypass outbound-click tracking.
- Never show Thai content on `/en` or `/zh`.
- Never drop the footer credit.
- Never fabricate reviews, ratings, "tested" claims, or merchant data.
- Never hardcode ranking weights or merchant lists.

See `docs/AI_RULES.md` for the longer rationale and edge cases.

---

Powered by 2T9COME
