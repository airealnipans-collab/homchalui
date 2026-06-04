// apps/web/app/go/[linkId]/route.ts
// Tracked affiliate outbound redirect. หอมฉลุย — Powered by 2T9COME.
// FLOW (ADR 0004): record best-effort → 302 to affiliate URL. Logging must NEVER block the
// redirect. The raw affiliate URL is never exposed elsewhere; buy buttons point here.
import { NextRequest } from "next/server";
import { resolveLink } from "@/lib/merchant-links";
import { incrOutbound, addUniqueClicker, enqueueEvent, rateLimit } from "@homchalui/redis";
import { localeSchema } from "@homchalui/validators";
import { env } from "@homchalui/config/env";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function GET(req: NextRequest, { params }: { params: { linkId: string } }) {
  const rl = await rateLimit("go", clientIp(req), env.RATE_LIMIT_GO_PER_MIN);
  if (!rl.allowed) return new Response("Too many requests", { status: 429 });

  const url = new URL(req.url);
  const locale = localeSchema.catch("th").parse(url.searchParams.get("locale"));
  const sid = url.searchParams.get("sid") ?? clientIp(req);
  const src = url.searchParams.get("src") ?? req.headers.get("referer") ?? undefined;

  const link = await resolveLink(params.linkId);
  if (!link) {
    return new Response("Link not found", { status: 404 });
  }

  // Best-effort: counters + unique clicker + server-side event. Fire-and-forget; do not await
  // its success before redirecting (the redirect is guaranteed).
  void Promise.allSettled([
    incrOutbound(link.productId, locale),
    addUniqueClicker(link.merchantId, locale, sid),
    enqueueEvent({
      event: "affiliate_outbound_click",
      locale,
      product_id: link.productId,
      merchant: link.merchantName,
      merchant_id: link.merchantId,
      link_id: link.id,
      source_page: src,
      session_id: sid,
      page_url: src ?? `/go/${link.id}`,
      timestamp: new Date().toISOString(),
    }),
  ]);

  // 302 so the click is not cached and the merchant always gets a fresh hop.
  return new Response(null, {
    status: 302,
    headers: { Location: link.affiliateUrl, "Cache-Control": "no-store" },
  });
}
