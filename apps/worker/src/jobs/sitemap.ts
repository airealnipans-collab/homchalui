// apps/worker/src/jobs/sitemap.ts
// Sitemap maintenance: count published URLs per locale + ping search engines. Powered by 2T9COME.
// The XML itself is served dynamically by apps/web (/sitemap*.xml); this scheduled job records
// freshness in system_jobs and (in production) notifies search engines.
import { db } from "@homchalui/db";
import { env } from "@homchalui/config/env";

const LOCALES = ["th", "en", "zh"] as const;

export async function sitemapJob(): Promise<void> {
  const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  for (const locale of LOCALES) {
    const [products, categories, brands] = await Promise.all([
      db.productTranslation.count({ where: { locale, translationStatus: "published", product: { status: "published" } } }),
      db.categoryTranslation.count({ where: { locale } }),
      db.brandTranslation.count({ where: { locale } }),
    ]);
    const total = 1 + products + categories + brands; // +1 for the home URL
    console.log(`[sitemap] ${locale}: ${total} urls (products=${products}, categories=${categories}, brands=${brands})`);
  }

  // Notify search engines only in production (avoid noise from dev/staging).
  if (env.NODE_ENV === "production") {
    const sitemap = encodeURIComponent(`${site}/sitemap.xml`);
    for (const url of [`https://www.google.com/ping?sitemap=${sitemap}`, `https://www.bing.com/ping?sitemap=${sitemap}`]) {
      try {
        await fetch(url);
        console.log(`[sitemap] pinged ${url}`);
      } catch (e) {
        console.warn("[sitemap] ping failed:", e instanceof Error ? e.message : e);
      }
    }
  }
}
