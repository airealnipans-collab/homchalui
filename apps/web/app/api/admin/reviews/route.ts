// apps/web/app/api/admin/reviews/route.ts — list + create reviews. หอมฉลุย — Powered by 2T9COME.
// RBAC: review.publish (the seeded review permission). Audited; recomputes AggregateRating.
import { NextRequest } from "next/server";
import { reviewCreate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { createReview, listReviewsAdmin } from "@/lib/admin-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function GET() {
  try {
    await authorize("review.publish");
    return Response.json({ items: await listReviewsAdmin() });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorize("review.publish");
    const json = await req.json().catch(() => null);
    const parsed = reviewCreate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const { id } = await createReview(parsed.data, user.id, clientIp(req));
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
