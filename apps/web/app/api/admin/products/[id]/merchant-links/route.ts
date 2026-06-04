// apps/web/app/api/admin/products/[id]/merchant-links/route.ts — add a merchant link to a product.
// หอมฉลุย — Powered by 2T9COME. RBAC: product.update. Audited.
import { NextRequest } from "next/server";
import { db } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import { merchantLinkUpsert } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("product.update");
    const json = await req.json().catch(() => null);
    const parsed = merchantLinkUpsert.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const product = await db.product.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!product) return Response.json({ error: { code: "not_found", message: "Product not found" } }, { status: 404 });

    const d = parsed.data;
    const link = await db.productMerchantLink.create({
      data: {
        productId: params.id,
        merchantId: d.merchantId,
        normalUrl: d.normalUrl ?? null,
        affiliateUrl: d.affiliateUrl,
        price: d.price ?? null,
        currency: d.currency,
        priority: d.priority,
        status: d.status,
      },
    });
    await writeAudit({ actorId: user.id, action: "merchant_link.create", entityType: "merchant_link", entityId: link.id, after: d, ip: clientIp(req) });
    await invalidateTag(`link:${link.id}`);
    return Response.json({ id: link.id }, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
