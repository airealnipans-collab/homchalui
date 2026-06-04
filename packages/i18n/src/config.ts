// packages/i18n/src/config.ts
// Single source of truth for locales. Imported by web app, middleware, sitemap,
// hreflang helpers, and the backoffice. หอมฉลุย — Powered by 2T9COME.

export const LOCALES = ["th", "en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "th";

/** Locales that get a URL prefix. Thai (default) intentionally has none. */
export const PREFIXED_LOCALES: Exclude<Locale, "th">[] = ["en", "zh"];

export const LOCALE_LABELS: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
  zh: "中文",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  th: "th-TH",
  en: "en",
  zh: "zh-Hans",
};

export const LOCALE_CURRENCY: Record<Locale, string> = {
  th: "THB",
  en: "THB", // prices are stored in THB; format per locale, optionally convert later
  zh: "THB",
};

/** Build a path for a given locale. Thai => no prefix. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === "/" ? "" : clean}`;
}

/** Extract locale from a pathname. Absence of a known prefix => default (th). */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return (PREFIXED_LOCALES as string[]).includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
