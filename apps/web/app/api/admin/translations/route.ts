// apps/web/app/api/admin/translations/route.ts — translation matrix. หอมฉลุย — Powered by 2T9COME.
// RBAC: translation.update. GET → matrix + completeness + should-translate-next queue.
import { authorize, toErrorResponse } from "@/lib/rbac";
import { getTranslationMatrix } from "@/lib/admin-translations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await authorize("translation.update");
    return Response.json(await getTranslationMatrix());
  } catch (e) {
    return toErrorResponse(e);
  }
}
