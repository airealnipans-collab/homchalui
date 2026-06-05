// apps/web/lib/best.ts
// "Best of" curated lists — a saved query over campaignTag. หอมฉลุย — Powered by 2T9COME.
// Published-translation-only + locale (no Thai fallback). Reuses the listing card machinery.
import type { Metadata } from "next";
import { db } from "@homchalui/db";
import { localizedPath, type Locale } from "@homchalui/i18n";
import type { ProductCardVM } from "@homchalui/validators";
import type { Alternates } from "./seo/hreflang";
import { buildMetadata, notFoundMetadata } from "./seo/metadata";
import { cardSelect, hydrate, badgeSignals, type CardRow } from "./listing";

// Localized titles for known curated lists (campaign tags). Falls back to the slug.
export const BEST_LABELS: Record<string, Record<Locale, string>> = {
  "best-budget": { th: "น้ำหอมคุ้มราคา", en: "Best value perfumes", zh: "高性价比香水" },
  "best-clean": { th: "กลิ่นสะอาดน่าใช้", en: "Best clean scents", zh: "干净香调精选" },
};

const INTRO: Record<Locale, (t: string) => string> = {
  th: (t) => `${t} — คัดมาแล้วจากทีมงานหอมฉลุย พร้อมคะแนนและช่องทางซื้อ`,
  en: (t) => `${t} — curated by the Homchalui team, with scores and where to buy.`,
  zh: (t) => `${t} — 由 หอมฉลุย 团队精选，附评分与购买渠道。`,
};

export interface BestList {
  slug: string;
  title: string;
  intro: string;
  items: ProductCardVM[];
}

function titleFor(slug: string, locale: Locale): string {
  return BEST_LABELS[slug]?.[locale] ?? slug;
}

export async function getBestList(slug: string, locale: Locale): Promise<BestList | null> {
  const signals = await badgeSignals(locale);
  const rows = await db.productTranslation.findMany({
    where: { locale, translationStatus: "published", product: { status: "published", campaignTag: slug } },
    orderBy: [
      { product: { manualPin: "desc" } },
      { product: { manualBoost: "desc" } },
      { product: { scores: { overallCached: "desc" } } },
    ],
    select: cardSelect(locale),
  });
  if (rows.length === 0) return null;
  const items = await hydrate(rows as CardRow[], locale, signals);
  const title = titleFor(slug, locale);
  return { slug, title, intro: INTRO[locale](title), items };
}

export async function bestAlternates(slug: string): Promise<Alternates> {
  const rows = await db.productTranslation.findMany({
    where: { translationStatus: "published", product: { status: "published", campaignTag: slug } },
    select: { locale: true },
    distinct: ["locale"],
  });
  const out: Alternates = {};
  for (const r of rows) out[r.locale] = localizedPath(r.locale, `/best/${slug}`);
  return out;
}

export async function bestMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const list = await getBestList(slug, locale);
  if (!list) return notFoundMetadata("ไม่พบลิสต์ | หอมฉลุย");
  return buildMetadata({
    locale,
    title: `${list.title} | หอมฉลุย`,
    description: list.intro,
    canonicalPath: localizedPath(locale, `/best/${slug}`),
    alternates: await bestAlternates(slug),
  });
}
