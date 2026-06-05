// e2e/admin-rbac.spec.ts — backoffice auth + RBAC. หอมฉลุย — Powered by 2T9COME.
import { test, expect } from "@playwright/test";

test("unauthenticated admin page redirects to login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("unauthenticated admin API returns 401", async ({ request }) => {
  const res = await request.get("/api/admin/products");
  expect(res.status()).toBe(401);
});

test("admin can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("อีเมล").fill("admin@homchalui.com");
  await page.getByLabel("รหัสผ่าน").fill("admin1234");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole("heading", { name: "แดชบอร์ด" })).toBeVisible();
  await expect(page.getByText("Powered by 2T9COME")).toBeVisible();
});
