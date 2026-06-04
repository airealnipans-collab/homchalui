// apps/web/lib/seo/hreflang.ts
// Canonical + hreflang helpers, shared by page metadata AND sitemaps. หอมฉลุย — Powered by 2T9COME.
// `Alternates` = locale → localized relative path, built ONLY from published translations
// (callers in lib/locale.ts). hreflang therefore never points at an unpublished/Thai-fallback URL.
import type { Locale } from "@homchalui/i18n";
import { clientEnv } from "@homchalui/config/env";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export type Alternates = Partial<Record<Locale, string>>;

export function absoluteUrl(path: string): string {
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** hreflang map (absolute URLs) for Next `Metadata.alternates.languages` — + x-default (Thai). */
export function toLanguages(alts: Alternates): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const [loc, path] of Object.entries(alts)) if (path) languages[loc] = absoluteUrl(path);
  if (alts.th) languages["x-default"] = absoluteUrl(alts.th);
  return languages;
}

export function metadataAlternates(canonicalPath: string, alts: Alternates): {
  canonical: string;
  languages: Record<string, string>;
} {
  return { canonical: absoluteUrl(canonicalPath), languages: toLanguages(alts) };
}

/** `<xhtml:link rel="alternate" hreflang=…>` lines for a sitemap <url> entry. */
export function hreflangLinksXml(alts: Alternates): string {
  const lines: string[] = [];
  for (const [loc, path] of Object.entries(alts)) {
    if (path) lines.push(`<xhtml:link rel="alternate" hreflang="${loc}" href="${absoluteUrl(path)}"/>`);
  }
  if (alts.th) lines.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(alts.th)}"/>`);
  return lines.join("");
}
