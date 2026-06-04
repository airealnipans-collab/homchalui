// packages/validators/src/tracking.test.ts — tracking envelope rules. หอมฉลุย — Powered by 2T9COME.
// Enforces the non-negotiable rule: EVERY event carries `locale` (CLAUDE.md §2.5), plus the
// per-event required-field refinements in trackingEventStrict.
import { describe, it, expect } from "vitest";
import { trackingEventStrict, outboundClickSchema } from "./tracking";

const base = {
  event: "page_view" as const,
  locale: "th" as const,
  page_url: "/",
  session_id: "sess-1",
};

describe("trackingEventStrict", () => {
  it("requires locale on every event", () => {
    const { locale, ...withoutLocale } = base;
    void locale;
    expect(trackingEventStrict.safeParse(withoutLocale).success).toBe(false);
  });

  it("accepts a minimal valid page_view", () => {
    expect(trackingEventStrict.safeParse(base).success).toBe(true);
  });

  it("rejects an unknown locale", () => {
    expect(trackingEventStrict.safeParse({ ...base, locale: "fr" }).success).toBe(false);
  });

  it("requires merchant + link_id for affiliate_outbound_click", () => {
    const r = trackingEventStrict.safeParse({ ...base, event: "affiliate_outbound_click" });
    expect(r.success).toBe(false);
    const ok = trackingEventStrict.safeParse({
      ...base,
      event: "affiliate_outbound_click",
      merchant: "Shopee",
      link_id: "link-1",
    });
    expect(ok.success).toBe(true);
  });

  it("requires product_id for view_item and search_term for search", () => {
    expect(trackingEventStrict.safeParse({ ...base, event: "view_item" }).success).toBe(false);
    expect(trackingEventStrict.safeParse({ ...base, event: "search" }).success).toBe(false);
    expect(
      trackingEventStrict.safeParse({ ...base, event: "search", search_term: "rose" }).success,
    ).toBe(true);
  });

  it("rejects events outside the catalog", () => {
    expect(trackingEventStrict.safeParse({ ...base, event: "made_up_event" }).success).toBe(false);
  });
});

describe("outboundClickSchema", () => {
  it("requires linkId + locale", () => {
    expect(outboundClickSchema.safeParse({ locale: "th" }).success).toBe(false);
    expect(outboundClickSchema.safeParse({ linkId: "l1", locale: "th" }).success).toBe(true);
  });
});
