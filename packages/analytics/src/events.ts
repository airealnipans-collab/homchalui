// packages/analytics/src/events.ts — typed event builders. หอมฉลุย — Powered by 2T9COME.
// The canonical home for event definitions (CLAUDE.md §4 — never invent event names inline).
// Each helper maps to a row in the TRACKING_EVENTS.md catalog and pushes via the dataLayer.
import type { Locale } from "@homchalui/i18n";
import { trackingEventName } from "@homchalui/validators";
import { pushEvent } from "./dataLayer";

/** The full catalog of allowed event names. */
export const EVENT_NAMES = trackingEventName.options;

export interface ProductFields {
  productId: string;
  productName?: string;
  brand?: string;
  category?: string;
  price?: number | null;
  listName?: string;
  position?: number;
}

function productParams(p: ProductFields): Record<string, unknown> {
  return {
    product_id: p.productId,
    product_name: p.productName,
    brand: p.brand,
    category: p.category,
    price: p.price ?? undefined,
    list_name: p.listName,
    position: p.position,
  };
}

export const pageView = (locale: Locale, pageType?: string) => pushEvent("page_view", locale, { page_type: pageType });

export const viewItem = (locale: Locale, p: ProductFields) => pushEvent("view_item", locale, productParams(p));

export const selectItem = (locale: Locale, p: ProductFields) => pushEvent("select_item", locale, productParams(p));

export const viewItemList = (locale: Locale, listName: string, resultsCount: number) =>
  pushEvent("view_item_list", locale, { list_name: listName, results_count: resultsCount });

export const search = (locale: Locale, term: string, resultsCount?: number) =>
  pushEvent("search", locale, { search_term: term, results_count: resultsCount });

export const filterApply = (locale: Locale, filterType: string, filterValue?: string) =>
  pushEvent("filter_apply", locale, { filter_type: filterType, filter_value: filterValue });

export const sortApply = (locale: Locale, sortKey: string) => pushEvent("sort_apply", locale, { sort_key: sortKey });

export const clickMerchantLink = (locale: Locale, p: ProductFields & { merchant: string }) =>
  pushEvent("click_merchant_link", locale, { ...productParams(p), merchant: p.merchant });

export const scrollDepth = (locale: Locale, percent: number, pageType?: string) =>
  pushEvent("scroll_depth", locale, { percent, page_type: pageType });
