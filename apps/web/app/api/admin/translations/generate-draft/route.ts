// apps/web/app/api/admin/translations/generate-draft/route.ts — machine draft. หอมฉลุย — Powered by 2T9COME.
// RBAC: translation.update. POST { entityType, entityId, targetLocale } → copies the Thai source into
// a machine_translated draft (202). Real MT integration is a later enhancement.
import { NextRequest } from "next/server";
import { generateDraftInput } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { generateDraft } from "@/lib/admin-translations";
import { ConflictError } from "@/lib/admin-products";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorize("translation.update");
    const json = await req.json().catch(() => null);
    const parsed = generateDraftInput.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const { id } = await generateDraft(parsed.data.entityType, parsed.data.entityId, parsed.data.targetLocale, user.id, clientIp(req));
    return Response.json({ id }, { status: 202 });
  } catch (e) {
    if (e instanceof ConflictError) return Response.json({ error: { code: "conflict", message: e.message } }, { status: 409 });
    return toErrorResponse(e);
  }
}
