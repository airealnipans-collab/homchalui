# BACKOFFICE_SPECS.md — หอมฉลุย admin screens

> Powered by 2T9COME
> Screen-by-screen spec for `/admin`. RBAC-guarded; every mutation writes `admin_audit_logs`.
> Footer `Powered by 2T9COME` on admin pages too. Extends `BACKOFFICE.md`. Forms: RHF + Zod.

## Shell
- Left nav: Dashboard, Products, Reviews, Layout, SEO, Translations, Analytics, Ranking, Users.
- Top bar: locale switcher (affects previews + stats), search, current user/role, sign out.
- Permission-aware: nav items + actions hidden/disabled when the role lacks the permission.

## 1. Dashboard `/admin/dashboard`
Cards: product count, review count, page views today, outbound clicks today. Tables: top
clicked products, top merchants, trending products, top search keywords, broken affiliate
links, products missing SEO, products missing image. Widgets: cron/job status (`system_jobs`),
recent admin activities. All filter by locale + date range. (GET /api/admin/dashboard.)

## 2. Products `/admin/products`
- **List:** searchable/filterable table (status, category, brand, locale, completeness). Bulk
  publish/archive. Column "completeness %".
- **Editor** `/admin/products/[id]` — tabs:
  - **Basic** (per-locale): name, slug (auto + editable, uniqueness-checked), brand, category,
    subcategory, description, short review, full review, status.
  - **Pricing:** price_min, price_max, currency, discount text.
  - **Scent profile:** notes (top/mid/base chips), family, mood, season, occasion, gender,
    scores (longevity, projection, sillage, value, sweetness, freshness, luxury, beginner).
  - **Media:** main image, gallery (drag-reorder), alt text per locale, video URL. Upload via
    R2 with type/size validation.
  - **Merchant links:** repeatable rows (merchant, logo, normal URL, affiliate URL, price,
    currency, status, priority, last_checked_at). Add unlimited merchants.
  - **SEO/AEO** (per-locale): meta title/desc, canonical, OG image, FAQ builder, schema
    override (JSON), AEO summary. Live Google + social preview.
  - **Ranking:** manual boost, manual pin, exclude from ranking, campaign tag.
  - Sidebar: **completeness checklist** (image, ≥1 merchant link, SEO, translations).
- **Validation:** unique `(locale, slug)`; `price_min ≤ price_max`; cannot publish a locale
  without required translation fields.

## 3. Reviews `/admin/reviews`
- List + editor (separate from products). Fields: title, body, reviewer, rating, pros, cons,
  best-for, not-for, images, **tested**, **sponsored**, published/update dates.
- **Guards:** `tested` requires explicit confirm ("ยืนยันว่าทดลองใช้จริง"); `sponsored`
  shows a front-end label; **no fake reviews** (policy reminder in UI).

## 4. Layout `/admin/layout`
- Page picker (home / landing:campaign) × locale. Drag-orderable section list. Add section
  (hero, product_carousel, category_grid, trending_list, editorial_picks, article_block,
  custom_html). Each section = a config form (validated by `layout.ts`) with **live preview**.
  `custom_html` sanitized. Publish/draft per page+locale.

## 5. SEO Manager `/admin/seo`
- Issue lists: missing meta title, missing meta description, missing FAQ, missing schema,
  duplicate slug, canonical errors. Per-locale **SEO health score**. Inline fix → PATCH.
  Google result preview + social share preview.

## 6. Translations `/admin/translations`
- Matrix: entity × {th, en, zh} with status chips (missing/draft/machine_translated/
  needs_review/approved/published/outdated). Actions: generate draft (machine), edit/review,
  approve, publish, mark outdated. **Should-translate-next** queue (high-traffic untranslated).
  **Translation completeness score.** Enforces Thai-source + no-fallback rules; editing Thai
  source auto-flags others `outdated`.

## 7. Analytics `/admin/analytics`
- Filters: locale, date range, device, source/medium/campaign. Views: traffic & CTR over time,
  product views/clicks, merchant outbound + CTR, search queries (+ zero-result), filter usage,
  top products/merchants, category/article performance, high-view/low-click products. Export CSV.

## 8. Ranking `/admin/ranking`
- Per algorithm (trending/best_click/editorial/personalize): weight editor, time window,
  bounce penalty, manual boost/pin lists, exclude list. Actions: recalculate now (enqueue),
  preview ranking (no write), save as new version, **rollback** to a prior version. Shows
  active version + last computed time per locale.

## 9. Users `/admin/users`
- User list, invite/create, assign roles. Roles: Super Admin, Admin, Editor, SEO Manager,
  Translator, Analyst, Viewer. Permission matrix view. 2FA enrollment. Audit-log viewer
  (filter by actor/entity/action/date) — read-only, immutable.

## Cross-cutting
- Optimistic UI with server confirmation; conflict handling on concurrent edits.
- All destructive actions confirm + audit. Sessions short-lived; sensitive actions re-auth.
- Every screen respects the active locale for previews and stats slicing.

---

Powered by 2T9COME
