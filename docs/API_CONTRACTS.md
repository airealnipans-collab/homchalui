# API_CONTRACTS.md — หอมฉลุย request/response schemas

> Powered by 2T9COME
> Complete I/O for every endpoint. All schemas are Zod (`packages/validators`). Locale-aware;
> public reads return **published-translation-only** for the requested locale (no Thai
> fallback). Extends `API.md`.

## Conventions
- `locale ∈ {th,en,zh}`; resolve: `?locale=` → path prefix → `th`.
- Success: `200/204`. Error: `{ error: { code, message, details? } }` with 4xx/5xx.
- List meta: `{ items, meta: { total, page, limit, hasMore } }` (or `nextCursor`).
- Money fields are numbers in `currency` (THB default).
- Times ISO-8601 UTC.

## Shared shapes
```ts
ProductCardVM = {
  id, slug, name, brand: { name, slug }, image: string|null,
  priceMin: number|null, priceMax: number|null, currency,
  rating: { value, count } | null,
  badges: ("trending"|"best_seller"|"best_value"|"luxury"|"long_lasting")[],
  longevity?: number, moodOrOccasion?: string, outboundClicks?: number
}
ErrorBody = { error: { code: string, message: string, details?: unknown } }
```

---

## Public API

### GET /api/products
**Query (all optional except locale defaulting):**
```
locale, category, brand, scent, minPrice, maxPrice, gender, mood, season, occasion,
longevity, projection, merchant, minRating, value,
sort = recommended|trending|most_clicked|best_reviewed|price_asc|price_desc|longevity|beginner,
page=1, limit=24
```
**200:** `{ items: ProductCardVM[], meta }`. Filters to published translation in `locale`.
`sort=trending` reads Redis `rank:trending:{locale}` then hydrates; others query DB with
indexes. **Errors:** `422 invalid_query`.

### GET /api/products/:slug
**Query:** `locale`. **200:** `ProductDetailVM` (see `apps/web/lib/products.ts` shape:
base + localized translation + scores + scentProfile + merchantLinks(as `/go/:id`) + rating +
aeoSummary + faqItems). **404:** no published translation. 

### GET /api/categories
**Query:** `locale`, `tree=true|false`. **200:** category list/tree (published translations).

### GET /api/categories/:slug
**Query:** `locale`. **200:** `{ category: {...}, seo, faq, intro }`. **404** if unpublished.

### GET /api/search
**Query:** `q` (required), `locale`, `page`, `limit`, plus same filter params as products.
**200:** `{ items: ProductCardVM[], meta, didYouMean?: string, zeroResult: boolean }`.
Side effect: upsert `search_query_stats` (+ `zero_result`). FTS Phase 1 → Meilisearch later.

### GET /api/recommendations
**Query:** `locale`, `type=similar|personal|trending`, `anchor?` (productId, required for
`similar`), `limit=12`. **200:** `{ items: ProductCardVM[] }`. `trending`→Redis;
`similar`→`recommendation_snapshots`/attribute match; `personal`→session signals (consent).

### POST /api/tracking/event ✅
**Body:** `TrackingEvent` (Zod, `locale` REQUIRED; see `packages/validators/tracking.ts`).
**204** on accept (enqueued). **422** invalid. **429** rate-limited.

### POST /api/outbound-click  ·  GET /go/:linkId ✅
**Body/Query:** `{ linkId, locale, sourcePage?, sessionId? }`. Records server-side
(`affiliate_outbound_click`, counters, unique clicker) then **302** to affiliate URL.
**404** unknown/disabled link. Never cached. (GET `/go` is the canonical button target.)

---

## Admin API (auth + RBAC; every mutation → `admin_audit_logs`)

### GET /api/admin/dashboard
**Query:** `locale?`, `from?`, `to?`. **200:** counts + top lists + job status + missing-SEO/
image + broken links + recent activities.

### Products
```
POST   /api/admin/products            body: ProductUpsert (perm product.create) → 201 {id}
PATCH  /api/admin/products/:id        body: Partial<ProductUpsert> (product.update) → 200
DELETE /api/admin/products/:id        (product.delete) → 204 (soft: status=archived)
POST   /api/admin/products/:id/merchant-links   body: MerchantLinkUpsert → 201
PATCH  /api/admin/merchant-links/:id  body: Partial<MerchantLinkUpsert> → 200
```
`ProductUpsert` = base (brandId, primaryCategoryId, status, price_min/max, currency, images,
manualBoost, manualPin, excludeFromRanking, campaignTag) + per-locale translation block(s)
(name, slug, descriptions, pros/cons, best/not-for, SEO, AEO, faqItems) + scores + scentProfile.
Server validates `UNIQUE(locale, slug)` and `price_min ≤ price_max`.

### Reviews
```
POST  /api/admin/reviews              body: ReviewUpsert (review.create) → 201
PATCH /api/admin/reviews/:id          body: Partial (review.update/review.publish) → 200
```
`ReviewUpsert` includes `tested`, `sponsored` (integrity: cannot set published+tested without
explicit flag; sponsored stored + surfaced).

### Layout
```
POST  /api/admin/layout               body: { key, locale, sections: LayoutSection[] } → 200
PATCH /api/admin/layout/sections/:id  body: Partial<LayoutSection> → 200
```
Section `config` validated by `layout.ts` per `type`.

### SEO
```
GET   /api/admin/seo                  → health report (missing title/desc/faq/schema, dup slug, canonical errors) + score
PATCH /api/admin/seo/:id              body: SeoMetadataUpsert → 200
```

### Analytics
```
GET /api/admin/analytics?metric=&locale=&from=&to=&device=&groupBy=
    → time series / breakdowns (views, clicks, outbound, ctr, search, filters, top products/merchants)
```

### Ranking
```
POST /api/admin/ranking/recalculate        body: { key, locale? } (algorithm.update) → 202 (enqueues worker)
GET  /api/admin/ranking/preview?key=&locale=  → would-be ranking (no write)
POST /api/admin/ranking/config             body: RankingConfigInput (new version, isActive toggles)
POST /api/admin/ranking/config/:id/rollback → activates a prior version
```

### Translations
```
GET   /api/admin/translations?entityType=&locale=&status=   → matrix + "should translate next" queue
PATCH /api/admin/translations/:id        body: { fields..., status } (translation.update) → 200
POST  /api/admin/translations/generate-draft   body: { entityType, entityId, targetLocale } → 202
```
Enforces Thai-source-of-truth + no-publish-without-review; sets `outdated` on source edits.

### Users
```
GET  /api/admin/users     (user.manage)
POST /api/admin/users     body: { email, name, roleIds[] }
PATCH/DELETE /api/admin/users/:id
```

## Auth, limits, errors
- Admin: NextAuth session + RBAC permission gate per route; CSRF on browser mutations.
- Public: per-IP rate limits (search/track/go); fail-open limiter.
- Error codes: `invalid_query`, `invalid_body`, `not_found`, `unauthorized`, `forbidden`,
  `conflict` (dup slug), `rate_limited`, `internal`.

---

Powered by 2T9COME
