// apps/web/app/api/admin/seo/[id]/route.ts — inline SEO fix. หอมฉลุย — Powered by 2T9COME.
// RBAC: seo.update. PATCH updates seoTitle/seoDescription of a translation row (audited).
import { NextRequest } from "next/server";
import { seoFix } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { applySeoFix } from "@/lib/admin-seo";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("seo.update");
    const json = await req.json().catch(() => null);
    const parsed = seoFix.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const ok = await applySeoFix(params.id, parsed.data, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Entity not found" } }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
