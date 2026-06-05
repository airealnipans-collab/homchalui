// apps/web/app/admin/(panel)/analytics/page.tsx — analytics dashboard. หอมฉลุย — Powered by 2T9COME.
// Merchant outbound + top products/merchants + search queries (incl. zero-result). RBAC analytics.view.
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { getAnalytics } from "@/lib/admin-analytics";

export const dynamic = "force-dynamic";

type Props = { searchParams: { from?: string; to?: string } };

function parseDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-dark">{value.toLocaleString()}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "analytics.view")) {
    return <p className="rounded-2xl border border-line bg-card p-6 text-sm text-error">ไม่มีสิทธิ์เข้าถึงรายงานวิเคราะห์</p>;
  }

  const from = parseDate(searchParams.from);
  const to = parseDate(searchParams.to);
  const a = await getAnalytics(from, to);
  const exportHref = `/api/admin/analytics/export${searchParams.from || searchParams.to ? `?from=${searchParams.from ?? ""}&to=${searchParams.to ?? ""}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-dark">วิเคราะห์</h1>
        <form className="flex items-center gap-2 text-sm">
          <input type="date" name="from" defaultValue={searchParams.from} className="rounded-lg border border-line px-2 py-1" />
          <span className="text-text-muted">–</span>
          <input type="date" name="to" defaultValue={searchParams.to} className="rounded-lg border border-line px-2 py-1" />
          <button className="rounded-full bg-brand px-3 py-1.5 text-white">กรอง</button>
          <a href={exportHref} className="rounded-full border border-line px-3 py-1.5 text-text-secondary">Export CSV</a>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card label="Product views" value={a.totals.views} />
        <Card label="Outbound clicks" value={a.totals.outbound} />
        <Card label="Searches" value={a.totals.searches} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-brand-dark">ร้านค้า (outbound)</h2>
          <Table head={["ร้านค้า", "คลิก"]} rows={a.topMerchants.map((m) => [m.name, String(m.outbound)])} empty="ยังไม่มีข้อมูลคลิกออก" />
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold text-brand-dark">สินค้าคลิกออกมากสุด</h2>
          <Table head={["สินค้า", "คลิก"]} rows={a.topProducts.map((p) => [p.name, String(p.outbound)])} empty="ยังไม่มีข้อมูล" />
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-dark">คำค้นหา (รวม zero-result)</h2>
        <Table
          head={["คำค้นหา", "ภาษา", "ครั้ง", "ไม่พบผล"]}
          rows={a.searches.map((s) => [s.query, s.locale, String(s.count), s.zeroResult ? "✓" : ""])}
          empty="ยังไม่มีการค้นหา"
        />
      </section>
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-bg-soft text-left text-xs text-text-muted">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="px-3 py-3 text-text-muted">{empty}</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
