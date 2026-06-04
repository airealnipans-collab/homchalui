// apps/web/app/api/search/route.ts
// GET /api/search — on-site product search. หอมฉลุย — Powered by 2T9COME.
// Requires `q`. Published-translation-only + locale (no Thai fallback). Records
// search_query_stats (+ zero_result) for every query. Rate-limited per IP (fail-open).
import { NextRequest } from "next/server";
import { searchQuery, queryToObject } from "@homchalui/validators";
import { rateLimit } from "@homchalui/redis";
import { env } from "@homchalui/config/env";
import { searchProducts } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit("search", clientIp(req), env.RATE_LIMIT_SEARCH_PER_MIN);
  if (!rl.allowed) {
    return Response.json({ error: { code: "rate_limited", message: "Too many requests" } }, { status: 429 });
  }

  const parsed = searchQuery.safeParse(queryToObject(new URL(req.url).searchParams));
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_query", message: "Invalid query parameters", details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  const result = await searchProducts(parsed.data);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
