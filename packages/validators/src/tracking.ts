// packages/validators/src/tracking.ts
// Zod schemas for tracking events. หอมฉลุย — Powered by 2T9COME.
// RULE: every event MUST include `locale`. See docs/TRACKING_EVENTS.md.
import { z } from "zod";

export const localeSchema = z.enum(["th", "en", "zh"]);

/** The canonical event catalog (do not invent ad-hoc names). */
export const trackingEventName = z.enum([
  "page_view",
  "view_item",
  "select_item",
  "view_item_list",
  "search",
  "filter_apply",
  "sort_apply",
  "click_buy_button",
  "click_merchant_link",
  "affiliate_outbound_click",
  "compare_product",
  "share_product",
  "read_review",
  "scroll_depth",
]);
export type TrackingEventName = z.infer<typeof trackingEventName>;

const deviceSchema = z.enum(["mobile", "tablet", "desktop"]).optional();

/** Common envelope present on every event. `locale` is required. */
export const trackingCommon = z.object({
  event: trackingEventName,
  locale: localeSchema, // REQUIRED — enforced for all events
  page_url: z.string().url().or(z.string().startsWith("/")),
  referrer: z.string().optional(),
  session_id: z.string().min(1),
  user_id: z.string().optional(),
  device: deviceSchema,
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  timestamp: z.string().datetime().optional(), // server fills if absent
});

/** Optional product-scoped fields (present on product/list/merchant events). */
export const productScope = z.object({
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  list_name: z.string().optional(),
  position: z.number().int().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  merchant: z.string().optional(),
});

/** Permissive payload bag for event-specific extras (search_term, percent, etc.). */
export const trackingExtra = z
  .object({
    search_term: z.string().optional(),
    results_count: z.number().int().nonnegative().optional(),
    filter_type: z.string().optional(),
    filter_value: z.string().optional(),
    sort_key: z.string().optional(),
    share_target: z.string().optional(),
    review_id: z.string().optional(),
    percent: z.number().min(0).max(100).optional(),
    page_type: z.string().optional(),
    link_id: z.string().optional(),
    merchant_id: z.string().optional(),
    source_page: z.string().optional(),
  })
  .partial();

/** Full ingest schema for POST /api/tracking/event. */
export const trackingEventSchema = trackingCommon.merge(productScope).merge(trackingExtra);
export type TrackingEvent = z.infer<typeof trackingEventSchema>;

/**
 * Per-event required-field refinement (lightweight, non-breaking):
 * outbound clicks must carry merchant + link_id; product views need product_id.
 */
export const trackingEventStrict = trackingEventSchema.superRefine((e, ctx) => {
  if (e.event === "affiliate_outbound_click") {
    if (!e.merchant) ctx.addIssue({ code: "custom", path: ["merchant"], message: "merchant required for affiliate_outbound_click" });
    if (!e.link_id) ctx.addIssue({ code: "custom", path: ["link_id"], message: "link_id required for affiliate_outbound_click" });
  }
  if (e.event === "view_item" && !e.product_id) {
    ctx.addIssue({ code: "custom", path: ["product_id"], message: "product_id required for view_item" });
  }
  if (e.event === "search" && !e.search_term) {
    ctx.addIssue({ code: "custom", path: ["search_term"], message: "search_term required for search" });
  }
});

/** Body schema for POST /api/outbound-click. */
export const outboundClickSchema = z.object({
  linkId: z.string().min(1),
  locale: localeSchema,
  sourcePage: z.string().optional(),
  sessionId: z.string().optional(),
});
export type OutboundClickInput = z.infer<typeof outboundClickSchema>;
