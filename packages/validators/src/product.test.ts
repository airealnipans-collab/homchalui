// packages/validators/src/product.test.ts — list/search query validation. Powered by 2T9COME.
// These rules drive the APIs' 422 behavior and the published/locale contract.
import { describe, it, expect } from "vitest";
import { productListQuery, searchQuery } from "./product";
import { queryToObject } from "./query";

describe("productListQuery", () => {
  it("applies defaults for an empty query", () => {
    const r = productListQuery.parse({});
    expect(r).toMatchObject({ locale: "th", sort: "recommended", page: 1, limit: 24 });
  });

  it("coerces numeric pagination from strings", () => {
    const r = productListQuery.parse({ page: "3", limit: "12" });
    expect(r.page).toBe(3);
    expect(r.limit).toBe(12);
  });

  it("rejects an unknown sort", () => {
    expect(productListQuery.safeParse({ sort: "cheapest" }).success).toBe(false);
  });

  it("rejects an unknown locale", () => {
    expect(productListQuery.safeParse({ locale: "fr" }).success).toBe(false);
  });

  it("rejects page < 1 and limit > 60", () => {
    expect(productListQuery.safeParse({ page: "0" }).success).toBe(false);
    expect(productListQuery.safeParse({ limit: "100" }).success).toBe(false);
  });

  it("rejects minPrice > maxPrice", () => {
    expect(productListQuery.safeParse({ minPrice: "500", maxPrice: "100" }).success).toBe(false);
    expect(productListQuery.safeParse({ minPrice: "100", maxPrice: "500" }).success).toBe(true);
  });

  it("validates merchant against the data-driven key list", () => {
    expect(productListQuery.safeParse({ merchant: "shopee" }).success).toBe(true);
    expect(productListQuery.safeParse({ merchant: "ebay" }).success).toBe(false);
  });
});

describe("searchQuery", () => {
  it("requires a non-empty q", () => {
    expect(searchQuery.safeParse({}).success).toBe(false);
    expect(searchQuery.safeParse({ q: "  " }).success).toBe(false); // trimmed to empty
    expect(searchQuery.safeParse({ q: "rose" }).success).toBe(true);
  });

  it("carries the same filters as the list query", () => {
    const r = searchQuery.parse({ q: "oud", category: "perfume", sort: "price_asc" });
    expect(r).toMatchObject({ q: "oud", category: "perfume", sort: "price_asc", locale: "th" });
  });
});

describe("queryToObject", () => {
  it("drops empty params so defaults apply", () => {
    const sp = new URLSearchParams("locale=&sort=trending&q=");
    expect(queryToObject(sp)).toEqual({ sort: "trending" });
  });
});
