// apps/web/app/api/admin/seo/route.ts — SEO health report. หอมฉลุย — Powered by 2T9COME.
// RBAC: seo.update. GET ?locale= → per-locale health score + issue list.
import { NextRequest } from "next/server";
import { localeQuery } from "@homchalui/validators";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { getSeoHealth } from "@/lib/admin-seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await authorize("seo.update");
    const locale = localeQuery.parse(new URL(req.url).searchParams.get("locale") ?? undefined);
    return Response.json(await getSeoHealth(locale));
  } catch (e) {
    return toErrorResponse(e);
  }
}
