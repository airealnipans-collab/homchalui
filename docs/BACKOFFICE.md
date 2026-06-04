# BACKOFFICE.md — หอมฉลุย Control Center

> Powered by 2T9COME
> All backoffice pages also render the footer `Powered by 2T9COME`. Every mutating action is
> RBAC-checked and written to `admin_audit_logs`.

## 1. Dashboard
Cards & widgets: product count, review count, page views today, outbound clicks today, top
clicked products, top merchants, trending products, top search keywords, broken affiliate
links, products missing SEO, products missing image, cron/job status (`system_jobs`), latest
admin activities (`admin_audit_logs`). All filterable by locale and date range.

## 2. Product Management (CRUD)
Tabs per product:

**Basic:** name, slug, brand, category, subcategory, description, short review, full review,
status (draft / published / archived). *(text fields are per-locale via `product_translations`).*

**Pricing:** price_min, price_max, currency, discount text.

**Scent profile:** top/middle/base notes, scent family, mood, season, occasion, gender target,
and scores: longevity, projection, sillage, value, sweetness, freshness, luxury.

**Media:** main image, gallery, alt text (per-locale), video URL.

**Merchant links:** merchant name, merchant logo, normal URL, affiliate URL, price, currency,
link status, priority, last_checked_at. Merchants are managed as data (add new anytime).

**SEO/AEO:** meta title, meta description, canonical URL, OG image, FAQ, schema override,
AEO summary (per-locale).

**Ranking:** manual boost, manual pin, exclude from ranking, campaign tag.

Per-product **completeness score** shows what's missing (image, SEO, translations, merchant
links).

## 3. Review Management
Reviews are a **separate entity** from products. Fields: title, body, reviewer, rating,
pros, cons, best-for, not-for, review images, published date, update date, **tested** status,
**sponsored** status. Hard rules: no fake reviews; `tested` may only be set when genuinely
tested; sponsored reviews are labeled on the front end and stored with `sponsored = true`.

## 4. Layout Builder
Section-based, JSON-configured home/landing layouts. Section types: hero banner, product
carousel, category grid, trending list, editorial picks, article block, custom HTML block.
Each section config example:
```json
{ "type": "product_carousel", "title": "น้ำหอมมาแรงวันนี้",
  "source": "trending", "limit": 12, "category": "perfume", "sort": "trending_score" }
```
Configs validated by `packages/validators/layout.ts`; rendered by `LayoutSectionRenderer`.
Layouts are per-locale (title text localized; data source shared but locale-filtered for
trending/click).

## 5. SEO/AEO Manager
Surfaces: pages missing meta title, missing meta description, missing FAQ, missing schema,
duplicate slug, canonical errors; Google result preview; social share preview. Per-locale
**SEO health score**.

## 6. Translation Management
Per-entity translation matrix (th/en/zh) with status (missing / draft / machine_translated /
needs_review / approved / published / outdated). Actions: generate draft (machine),
edit/review, approve, publish, mark outdated. Shows **translation completeness score** and a
"should translate next" queue (high-traffic untranslated products). Enforces the no-fallback
and Thai-source-of-truth rules from `I18N_RULES.md`.

## 7. Analytics
Product views, product clicks, merchant outbound clicks, CTR, search queries (incl.
zero-result), filter usage, top products, top merchants, category performance, article
performance, "high views / low clicks" products, broken links, missing SEO. All sliceable by
locale, date, device, source/medium/campaign.

## 8. Ranking / Algorithm Settings
Edit weights (view/click/review/freshness), bounce penalty, time window, manual boost/pin,
exclude-from-ranking; recalculate now; preview ranking; rollback config (`ranking_configs`
versioned, `ranking_snapshots` retained).

## 9. Users / Roles / Permissions
Roles: Super Admin, Admin, Editor, SEO Manager, Translator, Analyst, Viewer.
Permissions (examples): `product.create/update/delete`, `review.publish`, `seo.update`,
`layout.update`, `algorithm.update`, `translation.update`, `analytics.view`, `user.manage`.
Every significant action writes to `admin_audit_logs` (actor, action, entity, before/after,
timestamp, ip).

---

Powered by 2T9COME
