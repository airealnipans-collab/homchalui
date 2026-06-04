# PRODUCT_REQUIREMENTS.md — หอมฉลุย PRD

> Powered by 2T9COME

## 1. Vision
Be the most trustworthy place to decide which **scent product** to buy, with a shopping-grade
experience, then hand the user off to the merchant of their choice.

## 2. Target users
- Fragrance shoppers comparing options before buying on a marketplace.
- Gift buyers needing guidance (mood/occasion/budget).
- Home-scent buyers (candles, diffusers, sprays) wanting practical recommendations.
- Beginners who need "best for beginners" and budget-bounded guidance.

## 3. Product categories
Perfume (men / women / unisex), scented candle, incense, room spray, bathroom fragrance
(toilet drops, bathroom spray), car fragrance, home fragrance (reed diffusers, etc.),
miscellaneous scent goods. The category tree is data-driven (`categories` + parent/child).

## 4. Core user journeys
1. **Discover:** Home → trending/best/editorial sections or search/category.
2. **Filter & compare:** Category filters/sort; add to Compare.
3. **Decide:** Product detail — scores, scent profile, pros/cons, best-for/not-for, reviews,
   FAQ, similar products.
4. **Buy out:** Click a merchant button → tracked → redirected to affiliate URL.
5. **Return:** Recently viewed, wishlist (Phase 3), scent quiz (Phase 3).

## 5. Functional requirements (high level)
- Browse by category/brand/scent family; filter & sort (see `docs/FRONTEND.md`).
- Rich product detail with multi-axis scores and scent pyramid.
- Multi-merchant tracked outbound links; merchants are data-driven (never hardcoded).
- Editorial reviews separate from products; pros/cons/best-for/not-for; tested & sponsored
  flags.
- Search (Postgres FTS → Meilisearch later), with zero-result logging.
- Trending / best-click / editorial / similar / personalized recommendation surfaces.
- Trilingual content with strict no-fallback localization.
- Full backoffice CMS + analytics + control center.

## 6. Non-functional requirements
- **Performance:** mobile-first, fast LCP, image optimization, CDN/cache; tracking must not
  block UX (fire-and-forget + keepalive; redirect path stays fast).
- **SEO/AEO:** server-rendered HTML, complete metadata + JSON-LD, AEO answer blocks.
- **Accessibility:** semantic HTML, keyboard nav, sufficient contrast.
- **Reliability:** jobs idempotent; outbound redirect resilient even if logging fails.
- **Security/Privacy:** RBAC, audit log, consent-aware personalization, affiliate disclosure.

## 7. Business model & KPIs
Affiliate commissions. Primary KPIs: outbound clicks, unique clickers, merchant CTR,
product-page → outbound conversion, per-locale traffic & CTR. Secondary: content/SEO/
translation health scores, search zero-result rate, trending freshness.

## 8. Constraints (permanent)
Footer `Powered by 2T9COME`; review-commerce only (no own checkout P1–2); outbound tracking
before redirect; `th`/`en`/`zh` with Thai default no-prefix and no fallback; locale on every
event; no fake reviews; sponsored labeled.

## 9. Out of scope (Phase 1)
First-party checkout, payments, user accounts/wishlist, personalization beyond session,
dedicated search engine, price tracking. (See `docs/ROADMAP.md` for when these arrive.)

## 10. Additional/extra features (proposed)
Compare products, scent quiz, wishlist, recently viewed, broken-link checker, price snapshot,
campaign landing pages, affiliate disclosure component, editorial trust system, content
completeness score, product completeness score, translation completeness score, SEO health
score, search zero-result analytics, merchant performance dashboard.

---

Powered by 2T9COME
