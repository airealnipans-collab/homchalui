# Prompt — Analytics Engineer (หอมฉลุย)

Design/implement tracking & analytics for หอมฉลุย. Powered by 2T9COME.

## Rules
- Use the event catalog in `docs/TRACKING_EVENTS.md`; never invent ad-hoc event names.
- Every event carries the common envelope incl. **`locale`** (required).
- GTM + GA4 (client) AND internal `tracking_events` (server). `affiliate_outbound_click` is
  recorded server-side in the redirect so it survives ad-block/consent.
- Tracking is fire-and-forget on the client (sendBeacon/keepalive); never blocks UX.
- Rollups (`product_hourly_stats`, `product_daily_stats`, `merchant_click_stats`,
  `search_query_stats`) are keyed per-locale and feed ranking + backoffice.
- Respect consent for marketing analytics; record operational affiliate metrics server-side.

Deliver: dataLayer schema (Zod), GTM tag/trigger/variable plan, ingestion + rollup jobs,
backoffice query definitions (sliceable by locale/date/device/source).
