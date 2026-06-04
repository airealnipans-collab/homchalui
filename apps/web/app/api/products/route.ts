// apps/web/app/api/products/route.ts
// GET /api/products — filtered, sorted, paginated product cards. หอมฉลุย — Powered by 2T9COME.
// Published-translation-only for the requested locale (no Thai fallback). `sort=trending`/
// `most_clicked` read the Redis ranking set; others hit the DB. See docs/API_CONTRACTS.md.
import { NextRequest } from "next/server";
import { productListQuery, queryToObject } from "@homchalui/validators";
import { listProducts } from "@/lib/listing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // query-driven; caching is handled in Redis, not the route

export async function GET(req: NextRequest) {
  const parsed = productListQuery.safeParse(queryToObject(new URL(req.url).searchParams));
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_query", message: "Invalid query parameters", details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  const result = await listProducts(parsed.data);
  return Response.json(result, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120" },
  });
}
