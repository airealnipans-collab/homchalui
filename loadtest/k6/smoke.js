// loadtest/k6/smoke.js
// หอมฉลุย — light smoke test (dev/local). Powered by 2T9COME.
// Confirms the core flows respond under a little concurrency — NOT a load test (that's
// peak-1000rps.js against staging). Hits only seeded endpoints with lenient thresholds since
// `next dev` is unoptimized.
//   Run: BASE_URL=http://localhost:3000 k6 run loadtest/k6/smoke.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: Number(__ENV.VUS || 3),
  duration: __ENV.DURATION || "10s",
  thresholds: {
    // Correctness is the smoke signal: no failed requests.
    http_req_failed: ["rate<0.05"],
    // Latency is informational here — `next dev` compiles routes on first hit (cold = seconds).
    // Real latency budgets live in peak-1000rps.js against an optimized staging build.
    http_req_duration: ["p(95)<10000"],
  },
};

const HTML = ["/", "/en", "/zh", "/product/le-labe-fresh-tea", "/category/perfume", "/brand/le-labe", "/scent/fresh-floral"];

export default function () {
  let res = http.get(`${BASE}${HTML[Math.floor(Math.random() * HTML.length)]}`, { tags: { kind: "html" } });
  check(res, {
    "html 200": (r) => r.status === 200,
    "footer credit": (r) => !r.body || (typeof r.body === "string" && r.body.includes("Powered by 2T9COME")),
  });

  res = http.get(`${BASE}/api/products?locale=th&sort=trending`, { tags: { kind: "api" } });
  check(res, { "products 200": (r) => r.status === 200 });

  res = http.get(`${BASE}/api/search?q=tea&locale=th`, { tags: { kind: "api" } });
  check(res, { "search 200": (r) => r.status === 200 });

  res = http.post(
    `${BASE}/api/tracking/event`,
    JSON.stringify({
      event: "view_item",
      locale: "th",
      product_id: "prod_demo1",
      session_id: `k6-${__VU}-${__ITER}`,
      page_url: "/product/le-labe-fresh-tea",
      timestamp: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json" }, tags: { kind: "track" } },
  );
  check(res, { "track 204": (r) => r.status === 204 });

  res = http.get(`${BASE}/go/lnk_1?locale=th&sid=k6-${__VU}`, { redirects: 0, tags: { kind: "outbound" } });
  check(res, { "outbound 302": (r) => r.status === 302 });

  sleep(0.5);
}
