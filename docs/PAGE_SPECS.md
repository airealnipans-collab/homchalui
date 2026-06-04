# PAGE_SPECS.md — หอมฉลุย: complete page/route specification

> Powered by 2T9COME
> Every public route, fully specified for implementation. Conventions: Thai = default (no
> prefix), `/en` + `/zh` mirror the same tree. Server Components by default. Footer
> `Powered by 2T9COME` via the group layout on every page. No Thai fallback — a missing
> published translation ⇒ `notFound()`. See `FRONTEND.md`, `SEO_AEO.md`, `I18N_RULES.md`.

Legend: **Data** = server reads · **States** = loading/empty/error · **SEO** = metadata +
JSON-LD · **Track** = events fired.

---

## 1. Home — `/` (`app/(site)/page.tsx`) ✅ scaffolded
- **Sections** (Layout Builder driven via `LayoutSectionRenderer`): hero, search bar, category
  grid, best sellers (best-click), trending, most-clicked-out, editorial picks, gender lists
  (men/women/unisex), candle/incense/spray, room/bathroom/car, budget ≤500/≤1,000/≤3,000,
  clean/sweet/luxury/hotel, latest reviews, featured articles.
- **Data:** `layout_pages(key=home, locale)` → sections; each section resolves its `source`
  (`trending` → Redis `rank:trending:{locale}`; `editorial`/`best`/`latest` → DB).
- **States:** empty section ⇒ hidden; if no layout row ⇒ default ordering.
- **SEO:** Organization JSON-LD; home title/description; hreflang for published locales.
- **Track:** `page_view`, `view_item_list` per section, `select_item` on card click, `search`.

## 2. Category — `/category/[slug]`
- **Layout:** breadcrumb · H1 + intro SEO copy · filter rail (left/drawer on mobile) · sort
  control · product grid · pagination **or** infinite scroll · FAQ block · footer.
- **Data:** resolve `(locale, slug)` → category (published translation, else `notFound`);
  `GET /api/products` with filters (server-rendered first page, cached). SEO copy + FAQ from
  `category_translations`.
- **Filters** (URL search params, shareable/indexable canonical without volatile params):
  price range, product type/subcategory, gender/mood, longevity, projection/sillage, season,
  occasion, brand, scent notes, scent family, merchant/where-to-buy, review rating, value.
- **Sort:** recommended · trending · most_clicked · best_reviewed · price_asc · price_desc ·
  longevity · beginner.
- **States:** loading skeleton grid; empty ⇒ "no products / adjust filters" + suggestions;
  filter with zero results logged (search/zero-result analytics).
- **SEO:** `ItemList` + `BreadcrumbList` (+ `FAQPage`); canonical = clean category URL;
  paginated pages `rel=next/prev` or canonical to page 1 per strategy; hreflang published only.
- **Track:** `page_view`, `view_item_list`, `filter_apply`, `sort_apply`, `select_item`.

## 3. Product detail — `/product/[slug]` ✅ scaffolded
- **Layout:** breadcrumb · gallery · name/brand/type · overall + per-axis scores
  (`RatingBreakdown`) · price · `ScentProfile` (top/mid/base, family) · mood/occasion ·
  best-for/not-for · pros/cons · `ReviewSummary` (quick) · full review · merchant buttons
  (`MerchantButton` → `/go/:id`) · FAQ · similar products · people-also-viewed · AEO summary.
- **Data:** `getProductBySlug(slug, locale)` (cached, published-only); reviews; similar via
  `recommendation_snapshots`/attribute match; also-viewed via co-view stats (Phase 2+).
- **States:** missing translation ⇒ `notFound`; broken merchant links hidden; no reviews ⇒
  hide AggregateRating.
- **SEO:** `Product` + `Review` + `AggregateRating` + `FAQPage` + `BreadcrumbList`;
  `AggregateOffer` across merchants; canonical self; hreflang published only.
- **Track:** `view_item`, `read_review`, `click_buy_button`, `click_merchant_link`,
  `affiliate_outbound_click` (server), `compare_product`, `share_product`, `scroll_depth`.

## 4. Brand — `/brand/[slug]`
- Brand header (logo, description) + product grid (filter/sort like category, scoped to brand).
- **Data:** `brand_translations` + products where brand. **SEO:** `ItemList` + `BreadcrumbList`.
- **Track:** `view_item_list`, `select_item`.

## 5. Scent family — `/scent/[slug]`
- Like brand but scoped to scent family (e.g. fresh-floral, woody, sweet-gourmand). Intro copy
  explaining the family + grid. **SEO:** `ItemList` + `BreadcrumbList`.

## 6. Best list — `/best/[slug]`
- Curated/editorial ranked list (e.g. "best budget perfume ≤500", "longest lasting"). Ordered
  items with rationale + quick scores; strong AEO block ("best for / not for", price range).
- **Data:** editorially curated set or a saved query (campaign_tag / ranking). **SEO:**
  `ItemList` + `FAQPage` + `BreadcrumbList`; high AEO priority.
- **Track:** `view_item_list`, `select_item`, outbound.

## 7. Compare — `/compare/[slug]` (or `/compare?ids=a,b,c`)
- Side-by-side table: image, price, overall + per-axis scores, scent family/notes, mood,
  longevity, merchant min price, pros/cons. 2–4 products. Sticky header row on scroll.
- **Data:** products by ids/slug; compare tray persisted in `localStorage` (client).
- **States:** <2 selected ⇒ prompt to add; >4 ⇒ cap.
- **SEO:** `ItemList` + `FAQPage` + `BreadcrumbList` (only for curated `/compare/[slug]`
  pages; ad-hoc `?ids=` is `noindex`).
- **Track:** `compare_product`, `select_item`, outbound.

## 8. Guide — `/guide/[slug]`
- Long-form buying guide (how to choose, glossary, scent map). TOC, sections, embedded product
  callouts, FAQ. **Data:** `article_translations` (kind=guide). **SEO:** `Article` + `FAQPage`
  + `BreadcrumbList`.

## 9. Article — `/article/[slug]`
- Editorial/blog post. Cover, body (rich), related products/articles, FAQ. **SEO:** `Article`
  + `FAQPage` + `BreadcrumbList`. **Track:** `page_view`, `scroll_depth`, `select_item`.

## 10. Search results — `/search?q=` (+ `/en/search`, `/zh/search`)
- Query echo + result grid + filters/sort (reuse category rail) + "did you mean" + zero-result
  state with suggestions. **Data:** `GET /api/search` (FTS Phase 1 → Meilisearch later);
  log query + `zero_result`. **SEO:** `noindex` for query pages (canonical to category where
  applicable). **Track:** `search`, `view_item_list`, `select_item`, `filter_apply`.

## 11. System routes
- `/go/[linkId]` ✅ — tracked redirect (never cached, never indexed; robots disallow).
- `/api/*` — JSON, robots disallow.
- `/sitemap.xml` → index of `/sitemap-th.xml`, `/sitemap-en.xml`, `/sitemap-zh.xml`
  (published localized URLs only, with `xhtml:link` hreflang).
- `/robots.txt` — allow public; disallow `/admin`, `/api`, `/go`, `/search`; reference sitemap.
- `404` / `error` — localized; keep footer credit; offer search + popular categories.

## 12. Cross-cutting page rules
- Every page: footer `Powered by 2T9COME`; correct `<html lang>`; language switcher maps to the
  equivalent entity in the target locale (or "not available yet", never Thai fallback).
- Affiliate disclosure visible wherever merchant links appear.
- Mobile-first; no CLS from cards/badges/images; tracking is fire-and-forget.
- All list surfaces support the same filter/sort component for consistency.

---

Powered by 2T9COME
