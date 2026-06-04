# DATABASE.md — หอมฉลุย Data Model

> Powered by 2T9COME
> PostgreSQL + Prisma. Locale-specific text lives in **translation tables**, never as JSONB
> blobs on base rows. Canonical Prisma schema: `packages/db/prisma/schema.prisma`.

## 1. Design principles
- Base tables hold **locale-independent** data (ids, fks, prices, scores, images, status,
  timestamps). `*_translations` hold **locale-specific** text + slug + SEO/AEO + workflow
  status.
- Slugs are unique **per locale**: `UNIQUE(locale, slug)` on each translation table.
- Analytics is split into raw events (`tracking_events`) + rollups
  (`product_hourly_stats`, `product_daily_stats`, `merchant_click_stats`,
  `search_query_stats`), all keyed with `locale`.
- Ranking is versioned config (`ranking_configs`) + materialized output
  (`ranking_snapshots`, `recommendation_snapshots`).
- Index every FK and every `(entity_id, locale)` translation lookup.

## 2. Entity groups & key tables

### Core / auth
- `users(id, email, password_hash, name, is_active, totp_secret?, created_at, updated_at)`
- `roles(id, name)` · `permissions(id, key)` · `user_roles(user_id, role_id)` ·
  `role_permissions(role_id, permission_id)`

### Catalog
- `brands(id, logo_url, website_url, created_at, updated_at)`
- `brand_translations(id, brand_id, locale, name, slug, description, seo_title, seo_description)`
  — `UNIQUE(brand_id, locale)`, `UNIQUE(locale, slug)`
- `categories(id, parent_id?, sort_order, icon, created_at, updated_at)`
- `category_translations(id, category_id, locale, name, slug, description, seo_title, seo_description, aeo_summary)`
  — `UNIQUE(category_id, locale)`, `UNIQUE(locale, slug)`
- `products(id, brand_id, primary_category_id, status[draft|published|archived], price_min,
  price_max, currency, main_image_url, manual_boost, manual_pin, exclude_from_ranking,
  campaign_tag, created_at, updated_at)`
- `product_translations(id, product_id, locale, name, slug, short_description, full_description,
  review_summary, pros[], cons[], best_for, not_for, seo_title, seo_description, og_title,
  og_description, og_image_url, canonical_url, aeo_summary, faq_items(jsonb), schema_override(jsonb),
  translation_status, translated_by?, reviewed_by?, published_at?, created_at, updated_at)`
  — `UNIQUE(product_id, locale)`, `UNIQUE(locale, slug)`, index `(translation_status)`
- `product_categories(product_id, category_id)` — many-to-many secondary categories
- `product_images(id, product_id, url, alt_text_th?, alt_text_en?, alt_text_zh?, sort_order, is_main)`
- `product_scent_profiles(id, product_id, scent_family, mood[], season[], occasion[], gender_target,
  top_notes[], middle_notes[], base_notes[])`
- `product_scores(id, product_id, scent, longevity, projection, sillage, value, sweetness,
  freshness, luxury, beginner_friendly, overall_cached)`
- `product_merchant_links(id, product_id, merchant_id, normal_url, affiliate_url, price?, currency?,
  priority, status[active|broken|disabled], last_checked_at?, created_at, updated_at)`
- `merchants(id, key[shopee|lazada|central|amazon|tiktok|official|custom], name, logo_url, base_domain,
  is_active)` — **data-driven; add new merchants anytime**
- `tags(id, key, kind)` · `product_tags(product_id, tag_id)`

### Reviews (separate from products)
- `product_reviews(id, product_id, locale, title, body, reviewer, rating, pros[], cons[],
  best_for, not_for, tested boolean, sponsored boolean, published_at?, updated_at, created_at)`
- `product_review_images(id, review_id, url, alt_text?)`
- Constraint: `tested` and `sponsored` default false; UI must reflect them; no fake reviews.

### Content
- `articles(id, status, cover_image_url, author_id?, created_at, updated_at)`
- `article_translations(id, article_id, locale, title, slug, excerpt, content, seo_title,
  seo_description, aeo_summary, faq_items(jsonb), status)` — `UNIQUE(article_id, locale)`,
  `UNIQUE(locale, slug)`
- `faq_items(id, owner_type, owner_id, locale, question, answer, sort_order)` *(or embedded as
  jsonb on translations; both supported, prefer table for shared FAQs)*
- `seo_metadata(id, page_type, entity_id?, locale, title, description, canonical_url, og_image_url,
  robots, updated_at)` · `schema_overrides(id, page_type, entity_id, locale, jsonld(jsonb))`

### Layout
- `layout_pages(id, key[home|landing], locale, status, updated_at)`
- `layout_sections(id, layout_page_id, type, sort_order, config(jsonb), is_active)`

### Analytics
- `tracking_events(id, event, locale, product_id?, merchant_id?, session_id, user_id?, device,
  source?, medium?, campaign?, page_url, referrer?, payload(jsonb), created_at)`
  — indexes on `(event, created_at)`, `(product_id, locale, created_at)`, `(locale, created_at)`
- `product_hourly_stats(id, product_id, locale, views, detail_clicks, outbound_clicks, wishlist,
  review_engagement, ctr, calculated_at)` — `UNIQUE(product_id, locale, calculated_at)`
- `product_daily_stats(...)` — same shape, daily grain
- `merchant_click_stats(id, merchant_id, locale, date, outbound_clicks, unique_clickers, ctr)`
- `search_query_stats(id, locale, query, count, results_count, zero_result boolean, date)`

### Ranking / recommendation
- `ranking_configs(id, key[trending|best_click|editorial|personalize], version, weights(jsonb),
  time_window, bounce_penalty, is_active, created_by, created_at)` — versioned for rollback
- `ranking_snapshots(id, key, locale, product_id, score, rank, computed_at)`
- `recommendation_snapshots(id, scope[similar|personal], anchor_id, locale, product_id, score, computed_at)`

### i18n
- `locales(code, label, is_default, is_active)`
- `translation_jobs(id, entity_type, entity_id, target_locale, status, requested_by, created_at, finished_at?)`
- `translation_logs(id, entity_type, entity_id, locale, from_status, to_status, actor_id, note, created_at)`

### System
- `admin_audit_logs(id, actor_id, action, entity_type, entity_id, before(jsonb), after(jsonb), ip, created_at)`
- `system_jobs(id, name, status[idle|running|ok|failed], last_run_at?, last_error?, meta(jsonb))`
- `media_assets(id, url, kind, width?, height?, size_bytes?, uploaded_by, created_at)`

## 3. Key relationships
`brands 1—* products`; `categories 1—* products` (+ M:N via `product_categories`);
`products 1—* product_translations / images / merchant_links / reviews`; `products 1—1
product_scores / product_scent_profiles`; `merchants 1—* product_merchant_links`;
`articles 1—* article_translations`; `users *—* roles *—* permissions`.

## 4. Indexes & constraints (highlights)
- `UNIQUE(locale, slug)` on every translation table (no cross-locale slug collisions per locale).
- `UNIQUE(entity_id, locale)` on every translation table.
- Partial index `WHERE status='published'` / `translation_status='published'` for fast public
  reads.
- FK indexes on all `*_id`. Composite `(product_id, locale, calculated_at)` on stats.
- Check: `price_min <= price_max`; scores within configured range.

## 5. Migrations & seed
Prisma migrations only. Seed (`packages/db/seed.ts`): locales (th default), roles/permissions,
merchants (shopee/lazada/central/amazon/tiktok/official/custom), a few demo brands/categories/
products with th translations + sample reviews, and a default home `layout_page` per locale.

---

Powered by 2T9COME
