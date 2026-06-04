// apps/web/app/api/admin/merchant-links/[id]/route.ts — update a merchant link.
// หอมฉลุย — Powered by 2T9COME. RBAC: product.update. Audited; invalidates the cached link.
import { NextRequest } from "next/server";
import { db } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import { merchantLinkUpdate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("product.update");
    const json = await req.json().catch(() => null);
    const parsed = merchantLinkUpdate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const before = await db.productMerchantLink.findUnique({ where: { id: params.id } });
    if (!before) return Response.json({ error: { code: "not_found", message: "Link not found" } }, { status: 404 });

    const d = parsed.data;
    const link = await db.productMerchantLink.update({
      where: { id: params.id },
      data: {
        merchantId: d.merchantId,
        normalUrl: d.normalUrl === undefined ? undefined : d.normalUrl,
        affiliateUrl: d.affiliateUrl,
        price: d.price === undefined ? undefined : d.price,
        currency: d.currency,
        priority: d.priority,
        status: d.status,
      },
    });
    await writeAudit({ actorId: user.id, action: "merchant_link.update", entityType: "merchant_link", entityId: link.id, before, after: d, ip: clientIp(req) });
    await invalidateTag(`link:${params.id}`);
    return Response.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
