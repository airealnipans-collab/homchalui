# TRACKING_EVENTS.md — หอมฉลุย Analytics & dataLayer

> Powered by 2T9COME
> Companion: `docs/ANALYTICS.md`. Event schemas are defined in `packages/analytics` (Zod) and
> `packages/validators/tracking.ts`. **Every event MUST include `locale`.**

## 1. Stack
- **GTM** loaded site-wide (`NEXT_PUBLIC_GTM_ID`), with a defined `dataLayer` contract.
- **GA4** configured via GTM (GA4 events mirror the catalog below).
- **Internal `tracking_events` table** receives a server-side copy for first-party analytics,
  ranking inputs, and the backoffice — independent of client analytics/consent for
  business-critical events (e.g., outbound clicks recorded server-side in the redirect).

## 2. dataLayer contract
Push a `GtmEvent` object. Common envelope present on every event:

```ts
type GtmCommon = {
  event: string;          // event name (see catalog)
  locale: "th" | "en" | "zh";   // REQUIRED on every event
  page_url: string;
  referrer?: string;
  session_id: string;
  user_id?: string;       // only if authenticated
  device?: "mobile" | "tablet" | "desktop";
  source?: string; medium?: string; campaign?: string;
  timestamp: string;      // ISO 8601
};
```

Product-scoped events add: `product_id`, `product_name`, `brand`, `category`, and where
relevant `merchant`, `list_name`, `position`, `price`.

## 3. Event catalog
| Event | When | Key params (beyond envelope) |
|-------|------|------------------------------|
| `page_view` | every route view | `page_type` |
| `view_item` | product detail view | product fields |
| `select_item` | product card click | product fields, `list_name`, `position` |
| `view_item_list` | list/grid impression | `list_name`, `items[]` |
| `search` | search executed | `search_term`, `results_count` |
| `filter_apply` | filter changed | `filter_type`, `filter_value` |
| `sort_apply` | sort changed | `sort_key` |
| `click_buy_button` | "ไปซื้อ" pressed (pre-merchant choice) | product fields |
| `click_merchant_link` | merchant button pressed | product fields, `merchant` |
| `affiliate_outbound_click` | outbound redirect fires | product fields, `merchant`, `source_page`, `link_id` |
| `compare_product` | added to / viewed compare | product fields |
| `share_product` | share action | product fields, `share_target` |
| `read_review` | review expanded/read | product fields, `review_id` |
| `scroll_depth` | 25/50/75/100% | `percent`, `page_type` |

`affiliate_outbound_click` is also written **server-side** in `/go/:linkId` /
`/api/outbound-click` so it is captured even if the client never fires (ad-block/consent).

## 4. Canonical outbound example
```json
{
  "event": "affiliate_outbound_click",
  "locale": "th",
  "product_id": "123",
  "product_name": "Example Perfume",
  "merchant": "Shopee",
  "source_page": "/product/example-perfume",
  "link_id": "lnk_abc",
  "session_id": "sess_...",
  "device": "mobile",
  "timestamp": "2026-06-03T10:00:00.000Z"
}
```
(See `examples/tracking-event.example.json`.)

## 5. Server ingestion
`POST /api/tracking/event` validates with Zod, enriches (ip-derived geo optional, device from
UA), and inserts into `tracking_events`. High-volume events are buffered (Redis) and batch-
inserted. Hourly/daily rollups populate `product_hourly_stats`, `product_daily_stats`,
`merchant_click_stats`, `search_query_stats` — all keyed with `locale`.

## 6. Backoffice analytics (from this data)
Product views/clicks, merchant outbound clicks, CTR, search queries (+ zero-result), filter
usage, top products/merchants, category & article performance, high-view/low-click products,
broken links, missing SEO — all sliceable by locale/date/device/source.

## 7. Privacy & consent
Personalization beyond session is consent-gated. Business-critical first-party metrics
(outbound clicks for affiliate accounting) are recorded server-side as legitimate-interest
operational data; respect regional consent for marketing analytics in GTM/GA4.

---

Powered by 2T9COME
