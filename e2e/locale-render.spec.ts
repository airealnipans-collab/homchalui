// e2e/locale-render.spec.ts — front render per locale + tracking. หอมฉลุย — Powered by 2T9COME.
import { test, expect } from "@playwright/test";

test("Thai home: th lang + footer credit", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "th-TH");
  await expect(page.getByText("Powered by 2T9COME")).toBeVisible();
});

test("English home: en lang + footer credit", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Powered by 2T9COME")).toBeVisible();
});

test("Chinese home: zh lang", async ({ page }) => {
  await page.goto("/zh");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
});

test("product page fires view_item to dataLayer with locale", async ({ page }) => {
  await page.goto("/product/le-labe-fresh-tea");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The WP7 ProductAnalytics client component pushes view_item on mount.
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [];
        return dl.find((e) => e.event === "view_item") ?? null;
      }),
    )
    .not.toBeNull();
  const ev = await page.evaluate(() => {
    const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [];
    return dl.find((e) => e.event === "view_item");
  });
  expect(ev?.locale).toBe("th");
  expect(ev?.product_id).toBeTruthy();
  expect(ev?.session_id).toBeTruthy();
});

test("no Thai fallback: /en for a product without an English translation 404s", async ({ page }) => {
  const res = await page.goto("/en/product/this-slug-does-not-exist");
  expect(res?.status()).toBe(404);
});
