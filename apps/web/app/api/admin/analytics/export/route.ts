// apps/web/app/api/admin/analytics/export/route.ts — CSV export. หอมฉลุย — Powered by 2T9COME.
// RBAC: analytics.view. Exports top merchants + products outbound as CSV.
import { NextRequest } from "next/server";
import { authorize, toErrorResponse } from "@/lib/rbac";
import { getAnalytics } from "@/lib/admin-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET(req: NextRequest) {
  try {
    await authorize("analytics.view");
    const sp = new URL(req.url).searchParams;
    const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
    const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;
    const a = await getAnalytics(from && !Number.isNaN(from.getTime()) ? from : undefined, to && !Number.isNaN(to.getTime()) ? to : undefined);

    const lines = ["type,name,outbound_clicks"];
    for (const m of a.topMerchants) lines.push([`merchant`, csvCell(m.name), String(m.outbound)].join(","));
    for (const p of a.topProducts) lines.push([`product`, csvCell(p.name), String(p.outbound)].join(","));

    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="homchalui-analytics.csv"' },
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
