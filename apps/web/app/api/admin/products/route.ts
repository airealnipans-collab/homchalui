// apps/web/app/api/admin/products/route.ts — list + create products. หอมฉลุย — Powered by 2T9COME.
// RBAC: GET requires product.update; POST requires product.create. Audited in the service.
import { NextRequest } from "next/server";
import { productCreate } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { createProduct, listProductsAdmin, ConflictError } from "@/lib/admin-products";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function GET() {
  try {
    await authorize("product.update");
    return Response.json({ items: await listProductsAdmin() });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorize("product.create");
    const json = await req.json().catch(() => null);
    const parsed = productCreate.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid_body", message: "Validation failed", details: parsed.error.flatten() } }, { status: 422 });
    }
    const { id } = await createProduct(parsed.data, user.id, clientIp(req));
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof ConflictError) return Response.json({ error: { code: "conflict", message: e.message } }, { status: 409 });
    return toErrorResponse(e);
  }
}
