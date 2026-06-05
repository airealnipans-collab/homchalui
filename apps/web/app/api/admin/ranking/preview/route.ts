// apps/web/app/api/admin/ranking/preview/route.ts — preview ranking (no write). หอมฉลุย — Powered by 2T9COME.
// RBAC: algorithm.update. GET ?key=&locale= → top would-be ranking with product names.
import { NextRequest } from "next/server";
import { recomputableRankingKey, localeQuery } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { preview } from "@/lib/admin-ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await authorize("algorithm.update");
    const sp = new URL(req.url).searchParams;
    const key = recomputableRankingKey.safeParse(sp.get("key"));
    if (!key.success) return Response.json({ error: { code: "invalid_query", message: "bad key" } }, { status: 422 });
    const locale = localeQuery.parse(sp.get("locale") ?? undefined);
    return Response.json({ items: await preview(key.data, locale) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
