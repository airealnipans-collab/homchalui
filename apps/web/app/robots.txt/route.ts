// apps/web/app/robots.txt/route.ts
// robots.txt — หอมฉลุย. Powered by 2T9COME.
// Disallows non-indexable surfaces: backoffice (/admin), APIs (/api), the tracked outbound
// redirect (/go) and on-site search (/search). Points crawlers at the sitemap index.
import { clientEnv } from "@homchalui/config/env";

export const runtime = "nodejs";
export const dynamic = "force-static";

const DISALLOW = ["/admin", "/api", "/go", "/search"];

export function GET(): Response {
  const site = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const body = [
    "User-agent: *",
    ...DISALLOW.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
