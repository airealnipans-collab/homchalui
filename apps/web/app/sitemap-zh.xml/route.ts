// apps/web/app/sitemap-zh.xml/route.ts — Chinese sitemap. หอมฉลุย — Powered by 2T9COME.
// Published Chinese URLs only, each with xhtml:link hreflang alternates (published locales only).
import { localeSitemapXml } from "@/lib/seo/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(await localeSitemapXml("zh"), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
