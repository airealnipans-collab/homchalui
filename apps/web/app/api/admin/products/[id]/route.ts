// apps/web/app/api/admin/products/[id]/route.ts — update + soft-delete a product.
// หอมฉลุย — Powered by 2T9COME. RBAC: PATCH product.update, DELETE product.delete. Audited.
import { NextRequest } from "next/server";
import { productUpdate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { updateProduct, archiveProduct, ConflictError } from "@/lib/admin-products";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("product.update");
    const json = await req.json().catch(() => null);
    const parsed = productUpdate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const ok = await updateProduct(params.id, parsed.data, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Product not found" } }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ConflictError) return Response.json({ error: { code: "conflict", message: e.message } }, { status: 409 });
    return toErrorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authorize("product.delete");
    const ok = await archiveProduct(params.id, user.id, clientIp(req));
    if (!ok) return Response.json({ error: { code: "not_found", message: "Product not found" } }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
