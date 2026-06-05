// apps/web/app/api/admin/ranking/config/route.ts — save a new ranking config version.
// หอมฉลุย — Powered by 2T9COME. RBAC: algorithm.update. POST RankingConfigInput → new version.
import { NextRequest } from "next/server";
import { rankingConfigInput } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { createConfigVersion } from "@/lib/admin-ranking";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorize("algorithm.update");
    const json = await req.json().catch(() => null);
    const parsed = rankingConfigInput.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const out = await createConfigVersion(parsed.data, user.id, clientIp(req));
    return Response.json(out, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
