// apps/web/app/api/admin/reviews/[id]/route.ts — update/publish a review. หอมฉลุย — Powered by 2T9COME.
// RBAC: review.publish. Audited; recomputes AggregateRating on publish/unpublish.
import { NextRequest } from "next/server";
import { reviewUpdate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { updateReview } from "@/lib/admin-reviews";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("review.publish");
    const json = await req.json().catch(() => null);
    const parsed = reviewUpdate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const ok = await updateReview(params.id, parsed.data, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Review not found" } }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
