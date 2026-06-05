// apps/web/app/api/admin/ranking/config/[id]/rollback/route.ts — activate a prior version.
// หอมฉลุย — Powered by 2T9COME. RBAC: algorithm.update.
import { NextRequest } from "next/server";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { rollbackConfig } from "@/lib/admin-ranking";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("algorithm.update");
    const ok = await rollbackConfig(params.id, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Config not found" } }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
