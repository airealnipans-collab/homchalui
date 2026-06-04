// apps/web/app/sitemap-th.xml/route.ts — Thai sitemap. หอมฉลุย — Powered by 2T9COME.
// Published Thai URLs only, each with xhtml:link hreflang alternates (published locales only).
import { localeSitemapXml } from "@/lib/seo/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(await localeSitemapXml("th"), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
