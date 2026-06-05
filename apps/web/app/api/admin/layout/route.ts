// apps/web/app/api/admin/layout/route.ts — save a layout page. หอมฉลุย — Powered by 2T9COME.
// RBAC: layout.update. Replaces the page's sections (validated per type) + audits.
import { NextRequest } from "next/server";
import { layoutUpsert } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { upsertLayout } from "@/lib/admin-layout";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorize("layout.update");
    const json = await req.json().catch(() => null);
    const parsed = layoutUpsert.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const { id } = await upsertLayout(parsed.data, user.id, clientIp(req));
    return Response.json({ id });
  } catch (e) {
    return toErrorResponse(e);
  }
}
