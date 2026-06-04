// packages/i18n/src/config.test.ts — locale routing rules. หอมฉลุย — Powered by 2T9COME.
// Guards the non-negotiable i18n rules: Thai has NO prefix, /en and /zh do, and there is never
// a /th route (see I18N_RULES.md, CLAUDE.md §2).
import { describe, it, expect } from "vitest";
import { localizedPath, localeFromPath, isLocale, DEFAULT_LOCALE, LOCALES } from "./config";

describe("localizedPath", () => {
  it("never prefixes Thai (the default)", () => {
    expect(localizedPath("th", "/")).toBe("/");
    expect(localizedPath("th", "/product/abc")).toBe("/product/abc");
  });

  it("prefixes en and zh", () => {
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("en", "/product/abc")).toBe("/en/product/abc");
    expect(localizedPath("zh", "/category/perfume")).toBe("/zh/category/perfume");
  });

  it("normalizes a path without a leading slash", () => {
    expect(localizedPath("en", "product/abc")).toBe("/en/product/abc");
  });
});

describe("localeFromPath", () => {
  it("treats an unprefixed path as Thai", () => {
    expect(localeFromPath("/")).toBe("th");
    expect(localeFromPath("/product/abc")).toBe("th");
  });

  it("reads en/zh prefixes", () => {
    expect(localeFromPath("/en/product/abc")).toBe("en");
    expect(localeFromPath("/zh")).toBe("zh");
  });

  it("does not recognize a /th prefix as a locale segment", () => {
    // /th is never a real route; the first segment "th" is not a prefixed locale.
    expect(localeFromPath("/th/product/abc")).toBe("th");
  });
});

describe("isLocale", () => {
  it("accepts known locales only", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

it("default locale is Thai", () => {
  expect(DEFAULT_LOCALE).toBe("th");
});
