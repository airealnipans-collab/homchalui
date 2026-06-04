# ANALYTICS.md — หอมฉลุย

> Powered by 2T9COME
> Event contract & catalog live in `docs/TRACKING_EVENTS.md`. This doc covers the analytics
> model, rollups, and backoffice reporting.

## Pipeline
client (GTM dataLayer → GA4) ──┐
                               ├──► business reporting
server (`tracking_events`) ────┘──► ranking inputs + backoffice

- Client analytics: GTM → GA4 for marketing/behavioral analysis (consent-aware).
- First-party store: every event also persisted to `tracking_events` (locale-tagged).
- Outbound clicks recorded **server-side** in the redirect (reliable affiliate accounting).

## Rollups (per-locale)
- `product_hourly_stats` / `product_daily_stats` — views, detail clicks, outbound clicks,
  wishlist, review engagement, unique clickers, CTR.
- `merchant_click_stats` — outbound clicks, unique clickers, CTR per merchant per day.
- `search_query_stats` — query counts, results count, zero-result flag.
Computed by the worker (`stats rollup` job) from `tracking_events`.

## Backoffice reports
Product views/clicks, merchant outbound clicks, CTR, search queries (+ zero-result), filter
usage, top products/merchants, category & article performance, high-view/low-click products,
broken links, missing SEO — all sliceable by **locale**, date, device, source/medium/campaign.

## Health scores (derived metrics)
- **Content/product completeness**: required fields, image, merchant links present.
- **SEO health**: metadata/FAQ/schema present, no duplicate slug/canonical errors.
- **Translation completeness**: published locales vs. supported, outdated count.

## Locale analytics
Compare traffic, CTR, and outbound clicks across th/en/zh; surface "should translate next"
(high-traffic untranslated products) and per-locale keyword performance.

## GTM → GA4 configuration (WP7)
The site pushes the catalog events to `window.dataLayer` (see `packages/analytics`); GTM maps them
to GA4. Configure once in the GTM container (`NEXT_PUBLIC_GTM_ID`):

1. **GA4 Configuration tag** — Google tag with the GA4 Measurement ID (`NEXT_PUBLIC_GA4_ID`),
   firing on **Initialization – All Pages**.
2. **Data Layer Variables** (one per envelope/param field): `locale`, `session_id`, `page_url`,
   `product_id`, `product_name`, `brand`, `category`, `merchant`, `list_name`, `position`,
   `price`, `search_term`, `results_count`, `filter_type`, `filter_value`, `sort_key`, `percent`,
   `page_type`, `link_id`, `source_page`.
3. **Custom Event triggers** — one per catalog event name (`view_item`, `view_item_list`,
   `select_item`, `search`, `filter_apply`, `sort_apply`, `click_merchant_link`, `scroll_depth`,
   `page_view`, …); trigger on Custom Event = the event name.
4. **GA4 Event tags** — one per trigger, event name = the same catalog name, with the relevant
   Data Layer Variables mapped as event parameters. **Always include `locale`** as a parameter
   (and register it as a custom dimension in GA4) so every report can slice by locale.
5. **Consent** — gate marketing/analytics tags behind GTM Consent Mode. Business-critical
   `affiliate_outbound_click` is recorded server-side in `/go/:linkId` regardless of consent.

Event names + the required envelope are defined in `packages/analytics` and validated against
`packages/validators/tracking.ts` (in development, each pushed event is checked).
