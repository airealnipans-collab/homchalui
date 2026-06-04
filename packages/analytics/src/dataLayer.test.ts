// packages/analytics/src/dataLayer.test.ts — envelope + validator contract. Powered by 2T9COME.
import { describe, it, expect } from "vitest";
import { buildEvent } from "./dataLayer";
import { trackingEventStrict } from "@homchalui/validators";

const ctx = { pageUrl: "/product/x", sessionId: "sess-1", now: "2026-06-04T10:00:00.000Z" };

describe("buildEvent", () => {
  it("includes the required envelope on every event", () => {
    const e = buildEvent("page_view", "th", {}, ctx);
    expect(e).toMatchObject({ event: "page_view", locale: "th", session_id: "sess-1", page_url: "/product/x", timestamp: ctx.now });
    expect(trackingEventStrict.safeParse(e).success).toBe(true);
  });

  it("produces events that pass the tracking validator", () => {
    expect(trackingEventStrict.safeParse(buildEvent("view_item", "en", { product_id: "p1" }, ctx)).success).toBe(true);
    expect(trackingEventStrict.safeParse(buildEvent("scroll_depth", "zh", { percent: 50 }, ctx)).success).toBe(true);
    expect(
      trackingEventStrict.safeParse(buildEvent("click_merchant_link", "th", { merchant: "Shopee", link_id: "l1" }, ctx)).success,
    ).toBe(true);
  });

  it("fixed envelope wins over params (event/locale can't be spoofed)", () => {
    const e = buildEvent("select_item", "th", { event: "hacked", locale: "fr" }, ctx);
    expect(e.event).toBe("select_item");
    expect(e.locale).toBe("th");
  });

  it("flags an event missing its required fields (view_item without product_id)", () => {
    expect(trackingEventStrict.safeParse(buildEvent("view_item", "th", {}, ctx)).success).toBe(false);
  });
});
