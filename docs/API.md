# API.md — หอมฉลุย API

> Powered by 2T9COME
> All requests/responses validated with Zod (`packages/validators`). All endpoints are
> **locale-aware**. Public reads default to `th`; non-default locale via `?locale=en|zh` (or
> derived from the path on page routes). Admin endpoints require auth + RBAC.

## 1. Conventions
- Base: `/api`. JSON. ISO-8601 timestamps. cuid ids.
- Locale resolution order: explicit `?locale=` → path prefix → `DEFAULT_LOCALE` (`th`).
- Errors: `{ error: { code, message, details? } }` with appropriate HTTP status; messages are
  localized for user-facing surfaces.
- Pagination: `?page`, `?limit` (or cursor `?cursor`); responses include `meta.total`,
  `meta.page`, `meta.hasMore`.
- Auth: backoffice uses session (NextAuth) + RBAC permission checks; service-to-service uses a
  signed token. CSRF protection on mutating browser requests; rate limiting on public + auth.

## 2. Public API

### Products & catalog
```
GET  /api/products
       ?locale=th|en|zh &category=&brand=&scent=&minPrice=&maxPrice=
       &gender=&mood=&season=&occasion=&longevity=&merchant=&minRating=
       &sort=recommended|trending|most_clicked|best_reviewed|price_asc|price_desc|longevity|beginner
       &page=&limit=
     → only products with a PUBLISHED translation in `locale`
GET  /api/products/:slug?locale=th|en|zh    → full product detail (translation for locale)
GET  /api/categories?locale=                 → category tree (published translations)
GET  /api/categories/:slug?locale=           → category + listing meta
GET  /api/brands/:slug?locale=
GET  /api/scents/:slug?locale=
GET  /api/best/:slug?locale=                  → curated best-list
```

### Search & recommendations
```
GET  /api/search?q=&locale=&page=&limit=     → FTS (Phase 1) / Meilisearch (later); logs query + zero-result
GET  /api/recommendations?locale=
       &type=similar|personal|trending&anchor=<productId?>&limit=
```

### Tracking & outbound (mandatory flow)
```
POST /api/tracking/event       body: TrackingEvent (Zod; `locale` REQUIRED) → 204
POST /api/outbound-click       body: { linkId, locale, sourcePage }
       → records affiliate_outbound_click (server-side) → returns { redirectUrl } OR 302
GET  /go/:linkId?locale=&src=  → records then 302/307 redirect to affiliate URL
                                  (used as the MerchantButton href; never bypassed)
```

## 3. Admin API (auth + RBAC)
```
GET    /api/admin/dashboard?locale=&from=&to=
POST   /api/admin/products                 (product.create)
PATCH  /api/admin/products/:id             (product.update)
DELETE /api/admin/products/:id             (product.delete)
POST   /api/admin/products/:id/merchant-links
PATCH  /api/admin/merchant-links/:id

POST   /api/admin/reviews                  (review.create)
PATCH  /api/admin/reviews/:id              (review.update / review.publish)

POST   /api/admin/layout                   (layout.update) — create/replace a layout page
PATCH  /api/admin/layout/sections/:id      (layout.update)

GET    /api/admin/seo                      (seo.update) — health report (missing/duplicate/canonical)
PATCH  /api/admin/seo/:id                  (seo.update)

GET    /api/admin/analytics                (analytics.view) — sliceable by locale/date/device
POST   /api/admin/ranking/recalculate      (algorithm.update) — enqueue worker recompute
GET    /api/admin/ranking/preview          (algorithm.view)
POST   /api/admin/ranking/config           (algorithm.update) — new version
POST   /api/admin/ranking/config/:id/rollback

GET    /api/admin/translations             (translation.update) — matrix + status + queue
PATCH  /api/admin/translations/:id         (translation.update) — edit/approve/publish/mark-outdated
POST   /api/admin/translations/generate-draft   body:{ entityType, entityId, targetLocale }

GET    /api/admin/users                    (user.manage)
POST   /api/admin/users                    (user.manage)
```

## 4. Locale enforcement in responses
- Public endpoints **never** return Thai content for `en`/`zh` requests. If a product/category
  has no published translation in the requested locale, it is **omitted** from lists and the
  detail endpoint returns **404** (the page layer then 404s/redirects to localized home).
- List endpoints filter on `translation_status = 'published' AND locale = :locale`.

## 5. Example: product detail response (shape)
See `examples/product.example.json` and `examples/product-translation.example.json`.
Includes: base fields, localized translation, scores, scent profile, merchant links
(as tracked `/go/:linkId` targets), reviews summary, AEO summary, FAQ, JSON-LD payload.

## 6. Rate limiting & abuse
Public read: generous per-IP; `search` and `tracking/event` have burst limits + Redis buffer;
`outbound-click`/`/go` resilient (logging best-effort, redirect guaranteed). Admin endpoints:
per-user limits + audit logging.

---

Powered by 2T9COME
