// apps/web/lib/seo/metadata.ts
// Single metadata builder reused by every public page type. หอมฉลุย — Powered by 2T9COME.
// Produces title/description/canonical/hreflang/OG/Twitter consistently so no page hand-rolls it.
import type { Metadata } from "next";
import type { Locale } from "@homchalui/i18n";
import { metadataAlternates, type Alternates } from "./hreflang";

const OG_LOCALE: Record<Locale, string> = { th: "th_TH", en: "en_US", zh: "zh_CN" };

export interface BuildMetadataInput {
  locale: Locale;
  title: string;
  description?: string | null;
  /** Localized relative path of this page (used for canonical unless `canonicalOverride`). */
  canonicalPath: string;
  /** locale → localized path, published-only (drives hreflang). */
  alternates: Alternates;
  canonicalOverride?: string | null;
  image?: string | null;
  ogType?: "website" | "article";
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { canonical, languages } = metadataAlternates(input.canonicalPath, input.alternates);
  return {
    title: input.title,
    description: input.description ?? undefined,
    alternates: { canonical: input.canonicalOverride ?? canonical, languages },
    openGraph: {
      title: input.title,
      description: input.description ?? undefined,
      url: canonical,
      images: input.image ? [input.image] : [],
      locale: OG_LOCALE[input.locale],
      type: input.ogType ?? "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

/** Metadata for a page whose entity/translation is missing (noindex, never Thai fallback). */
export function notFoundMetadata(title: string): Metadata {
  return { title, robots: { index: false } };
}
