// apps/web/app/api/admin/layout/sections/[id]/route.ts — patch one section. หอมฉลุย — Powered by 2T9COME.
// RBAC: layout.update. Audited; invalidates the front layout cache.
import { NextRequest } from "next/server";
import { layoutSectionUpdate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { updateSection } from "@/lib/admin-layout";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("layout.update");
    const json = await req.json().catch(() => null);
    const parsed = layoutSectionUpdate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const ok = await updateSection(params.id, parsed.data, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Section not found" } }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
