# Load testing — หอมฉลุย

> Powered by 2T9COME
> Validates the **1,000 req/s peak** target from `docs/SCALABILITY.md`.

## Prereqs
- Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
- A **staging** environment with seeded, **published** data (run against staging, not prod).
- Export real identifiers from your seed so the test hits cache-warmable, valid routes:
  - `PRODUCT_SLUGS` — published product slugs
  - `CATEGORY_SLUGS` — published category slugs
  - `SEARCH_TERMS` — representative queries (include some zero-result ones)
  - `LINK_IDS` — valid `product_merchant_links` ids for `/go/:linkId`

## Run
```bash
BASE_URL=https://staging.homchalui.com \
PRODUCT_SLUGS=le-labe-fresh-tea,demo-candle \
CATEGORY_SLUGS=perfume,scented-candle \
LINK_IDS=lnk_1,lnk_2,lnk_3 \
k6 run loadtest/k6/peak-1000rps.js
```

## Traffic mix (matches docs/SCALABILITY.md §1)
70% cacheable HTML · 18% dynamic API reads · 8% tracking events · 3% outbound clicks.

## Pass criteria (thresholds in the script)
- Errors < 0.1% (`errors`, `http_req_failed`).
- p95 reads < 300ms; p95 tracking ingest < 50ms; p95 outbound redirect < 100ms.
- Overall p95 < 400ms, p99 < 800ms while sustaining 1,000 rps for 10 min (+1,500 rps burst).

## What to watch on the system side while running
- **Cache hit ratio** (target > 90% on hot reads) and Redis memory/ops.
- **PgBouncer** saturation and Postgres CPU/connections (should stay low — most reads are cached).
- **Event queue depth** (`q:events`) — should drain continuously, not grow unbounded.
- Reconcile `affiliate_outbound_click`: Redis counters vs. `product_hourly_stats` after rollup.
- Sentry/OpenTelemetry error + latency dashboards.

## Notes
- The outbound scenario uses `redirects: 0` so it measures **our** hop (record + 302), not the
  merchant site.
- The HTML check asserts the `Powered by 2T9COME` footer is present (permanent requirement).
- Start with a smaller `target` (e.g. 250) to warm caches before pushing to 1,000.
