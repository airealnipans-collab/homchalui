// apps/web/app/api/admin/upload/route.ts — validated media upload. หอมฉลุย — Powered by 2T9COME.
// RBAC: product.update. Validates content-type + size (uploadMeta) BEFORE storing. Object storage
// (R2) upload lands when creds are configured; until then it validates and reports 501 so the
// editor's URL field is used. Never accepts an unvalidated/oversized/non-image file.
import { NextRequest } from "next/server";
import { uploadMeta } from "@homchalui/validators";
import { env } from "@homchalui/config/env";
import { authorize, toErrorResponse } from "@/lib/rbac";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await authorize("product.update");
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: { code: "invalid_body", message: "file (multipart) is required" } }, { status: 422 });
    }
    const meta = uploadMeta.safeParse({ filename: file.name, contentType: file.type, size: file.size });
    if (!meta.success) {
      return Response.json({ error: { code: "invalid_upload", message: "Unsupported type or file too large", details: meta.error.flatten() } }, { status: 422 });
    }

    if (!env.R2_ACCESS_KEY_ID || !env.R2_PUBLIC_BASE_URL) {
      return Response.json(
        { error: { code: "storage_unconfigured", message: "Upload validated, but object storage (R2) is not configured. Paste an image URL instead." } },
        { status: 501 },
      );
    }
    // TODO: stream to R2 (S3 PutObject) and return the public URL once R2 creds are wired.
    return Response.json({ error: { code: "not_implemented", message: "R2 upload not implemented yet" } }, { status: 501 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
