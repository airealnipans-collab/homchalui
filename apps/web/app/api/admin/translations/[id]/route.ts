// apps/web/app/api/admin/translations/[id]/route.ts — set translation status. หอมฉลุย — Powered by 2T9COME.
// RBAC: translation.update. PATCH { entityType, status } — publish requires approved (409 otherwise).
import { NextRequest } from "next/server";
import { translationStatusUpdate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { setTranslationStatus } from "@/lib/admin-translations";
import { ConflictError } from "@/lib/admin-products";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("translation.update");
    const json = await req.json().catch(() => null);
    const parsed = translationStatusUpdate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const ok = await setTranslationStatus(parsed.data.entityType, params.id, parsed.data.status, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Translation not found" } }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ConflictError) return Response.json({ error: { code: "conflict", message: e.message } }, { status: 409 });
    return toErrorResponse(e);
  }
}
