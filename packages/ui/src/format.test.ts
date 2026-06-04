// packages/ui/src/format.test.ts — locale-aware price formatting. Powered by 2T9COME.
import { describe, it, expect } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats THB without fraction digits", () => {
    const out = formatPrice(1234, "THB", "th");
    expect(out).toMatch(/1,234/);
    expect(out).not.toMatch(/\.00/);
  });

  it("works across locales without throwing", () => {
    for (const l of ["th", "en", "zh"] as const) {
      expect(typeof formatPrice(500, "THB", l)).toBe("string");
    }
  });

  it("falls back gracefully on an unknown currency code", () => {
    expect(formatPrice(100, "XYZ", "en")).toContain("100");
  });
});
