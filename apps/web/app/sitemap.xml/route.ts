// apps/web/app/sitemap.xml/route.ts — sitemap index. หอมฉลุย — Powered by 2T9COME.
// Points at the per-locale sitemaps (/sitemap-th.xml, /sitemap-en.xml, /sitemap-zh.xml).
import { sitemapIndexXml } from "@/lib/seo/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(sitemapIndexXml(), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
