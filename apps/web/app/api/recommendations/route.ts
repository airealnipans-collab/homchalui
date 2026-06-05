// apps/web/app/api/recommendations/route.ts — GET recommendations. หอมฉลุย — Powered by 2T9COME.
// ?type=similar|trending|personal & locale & anchor(productId, required for similar) & limit.
// Published-translation-only + locale. (personal is consent-gated → trending fallback for now.)
import { NextRequest } from "next/server";
import { localeQuery } from "@homchalui/validators";
import { getSimilar, getTrendingRecos } from "@/lib/recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const locale = localeQuery.parse(sp.get("locale") ?? undefined);
  const type = sp.get("type") ?? "trending";
  const limit = Math.min(24, Math.max(1, Number(sp.get("limit")) || 12));

  if (type === "similar") {
    const anchor = sp.get("anchor");
    if (!anchor) {
      return Response.json({ error: { code: "invalid_query", message: "anchor (productId) required for similar" } }, { status: 422 });
    }
    return Response.json({ items: await getSimilar(anchor, locale, limit) });
  }

  // trending + personal (fallback to trending until consented personalization lands)
  return Response.json(
    { items: await getTrendingRecos(locale, limit) },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
  );
}
