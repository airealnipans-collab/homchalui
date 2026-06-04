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
