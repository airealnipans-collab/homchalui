// loadtest/k6/peak-1000rps.js
// หอมฉลุย — peak load test targeting ~1,000 req/s. Powered by 2T9COME.
//
// Mirrors the traffic mix in docs/SCALABILITY.md §1:
//   ~70% cacheable HTML reads (home / product / category)
//   ~18% dynamic API reads (search / listing / recommendations)
//   ~8%  tracking events (POST /api/tracking/event)
//   ~3%  outbound clicks (GET /go/:linkId, redirect not followed)
//
// Run:
//   BASE_URL=https://staging.homchalui.com k6 run loadtest/k6/peak-1000rps.js
//   # ramp to 1000 rps, hold 10m, burst to 1500 rps
//
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

// Sample data — replace with real published slugs/ids/linkIds from a seed export.
const LOCALES = ["", "/en", "/zh"]; // "" = Thai (no prefix)
const PRODUCT_SLUGS = (__ENV.PRODUCT_SLUGS || "le-labe-fresh-tea,demo-candle,demo-incense").split(",");
const CATEGORY_SLUGS = (__ENV.CATEGORY_SLUGS || "perfume,scented-candle,room-spray").split(",");
const SEARCH_TERMS = (__ENV.SEARCH_TERMS || "กลิ่นสะอาด,vanilla,เทียนหอม,unisex").split(",");
const LINK_IDS = (__ENV.LINK_IDS || "lnk_1,lnk_2,lnk_3").split(",");

// Custom metrics
const errorRate = new Rate("errors");
const cacheReadTrend = new Trend("read_cache_ms", true);
const trackTrend = new Trend("track_ingest_ms", true);
const redirectTrend = new Trend("outbound_redirect_ms", true);

export const options = {
  // Arrival-rate model so we hit a true req/s target regardless of latency.
  scenarios: {
    peak: {
      executor: "ramping-arrival-rate",
      startRate: 100,
      timeUnit: "1s",
      preAllocatedVUs: 400,
      maxVUs: 2000,
      stages: [
        { target: 250, duration: "1m" },   // warm caches
        { target: 1000, duration: "2m" },  // ramp to target
        { target: 1000, duration: "10m" }, // sustain 1,000 rps
        { target: 1500, duration: "2m" },  // burst headroom check
        { target: 0, duration: "1m" },     // ramp down
      ],
    },
  },
  thresholds: {
    errors: ["rate<0.001"],                         // < 0.1% errors
    http_req_failed: ["rate<0.001"],
    read_cache_ms: ["p(95)<300"],                   // cached/dynamic reads
    track_ingest_ms: ["p(95)<50"],                  // enqueue-only ingest
    outbound_redirect_ms: ["p(95)<100"],            // record + 302
    http_req_duration: ["p(95)<400", "p(99)<800"],
  },
};

function pickLocale() {
  return randomItem(LOCALES);
}

export default function () {
  const r = Math.random();

  if (r < 0.7) {
    // ── 70%: cacheable HTML reads ──
    const loc = pickLocale();
    const kind = Math.random();
    let url;
    if (kind < 0.45) url = `${BASE}${loc}/`;
    else if (kind < 0.8) url = `${BASE}${loc}/product/${randomItem(PRODUCT_SLUGS)}`;
    else url = `${BASE}${loc}/category/${randomItem(CATEGORY_SLUGS)}`;

    const res = http.get(url, { tags: { kind: "html_read" } });
    cacheReadTrend.add(res.timings.duration);
    check(res, {
      "html 200": (x) => x.status === 200,
      "has footer credit": (x) => !x.body || x.body.includes("Powered by 2T9COME"),
    }) || errorRate.add(1);

  } else if (r < 0.88) {
    // ── 18%: dynamic API reads ──
    const loc = (pickLocale() || "").replace("/", "") || "th";
    const which = Math.random();
    let url;
    if (which < 0.5) url = `${BASE}/api/search?q=${encodeURIComponent(randomItem(SEARCH_TERMS))}&locale=${loc}`;
    else if (which < 0.8) url = `${BASE}/api/products?category=${randomItem(CATEGORY_SLUGS)}&locale=${loc}&sort=trending`;
    else url = `${BASE}/api/recommendations?type=trending&locale=${loc}&limit=12`;

    const res = http.get(url, { tags: { kind: "api_read" } });
    cacheReadTrend.add(res.timings.duration);
    check(res, { "api 200": (x) => x.status === 200 }) || errorRate.add(1);

  } else if (r < 0.96) {
    // ── 8%: tracking events (should return 204 fast) ──
    const loc = (pickLocale() || "").replace("/", "") || "th";
    const payload = JSON.stringify({
      event: "view_item",
      locale: loc,
      product_id: randomItem(PRODUCT_SLUGS),
      session_id: `k6-${__VU}-${__ITER}`,
      page_url: `${BASE}${pickLocale()}/product/${randomItem(PRODUCT_SLUGS)}`,
      device: "mobile",
      timestamp: new Date().toISOString(),
    });
    const res = http.post(`${BASE}/api/tracking/event`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { kind: "track" },
    });
    trackTrend.add(res.timings.duration);
    check(res, { "track 204": (x) => x.status === 204 || x.status === 200 }) || errorRate.add(1);

  } else {
    // ── 3%: outbound click — do NOT follow the redirect (measure our hop only) ──
    const loc = (pickLocale() || "").replace("/", "") || "th";
    const res = http.get(
      `${BASE}/go/${randomItem(LINK_IDS)}?locale=${loc}&sid=k6-${__VU}&src=/product/${randomItem(PRODUCT_SLUGS)}`,
      { redirects: 0, tags: { kind: "outbound" } },
    );
    redirectTrend.add(res.timings.duration);
    check(res, { "outbound 30x": (x) => x.status >= 300 && x.status < 400 }) || errorRate.add(1);
  }

  // Small think time so VUs aren't perfectly synchronized.
  sleep(Math.random() * 0.3);
}
