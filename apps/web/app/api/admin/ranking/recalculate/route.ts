// apps/web/app/api/admin/ranking/recalculate/route.ts — recompute a ranking. หอมฉลุย — Powered by 2T9COME.
// RBAC: algorithm.update. POST { key, locale? } → recomputes inline (Redis + snapshot) → 202.
import { NextRequest } from "next/server";
import { rankingRecalcInput } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { recalculate } from "@/lib/admin-ranking";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorize("algorithm.update");
    const json = await req.json().catch(() => null);
    const parsed = rankingRecalcInput.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const result = await recalculate(parsed.data.key, parsed.data.locale, user.id, clientIp(req));
    return Response.json({ key: parsed.data.key, result }, { status: 202 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
