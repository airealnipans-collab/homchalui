// e2e/outbound.spec.ts — tracked outbound redirect. หอมฉลุย — Powered by 2T9COME.
import { test, expect } from "@playwright/test";

test("/go/:linkId records then 302-redirects to the affiliate URL", async ({ request }) => {
  const res = await request.get("/go/lnk_1?locale=th&sid=e2e-test", { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toContain("shopee.co.th");
});

test("/go/:linkId for an unknown link returns 404", async ({ request }) => {
  const res = await request.get("/go/does-not-exist?locale=th", { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});
