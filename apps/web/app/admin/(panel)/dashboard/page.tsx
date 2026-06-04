// apps/web/app/admin/(panel)/dashboard/page.tsx — backoffice dashboard. หอมฉลุย — Powered by 2T9COME.
import { db } from "@homchalui/db";

export const dynamic = "force-dynamic";

async function load() {
  const [products, published, reviews, merchants, links, jobs, audits] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "published" } }),
    db.productReview.count(),
    db.merchant.count(),
    db.productMerchantLink.count({ where: { status: "active" } }),
    db.systemJob.findMany({ orderBy: { name: "asc" } }),
    db.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { email: true } } } }),
  ]);
  return { products, published, reviews, merchants, links, jobs, audits };
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-dark">{value.toLocaleString()}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const d = await load();
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-brand-dark">แดชบอร์ด</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card label="สินค้าทั้งหมด" value={d.products} />
        <Card label="เผยแพร่แล้ว" value={d.published} />
        <Card label="รีวิว" value={d.reviews} />
        <Card label="ร้านค้า" value={d.merchants} />
        <Card label="ลิงก์ร้าน (active)" value={d.links} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-dark">สถานะงานเบื้องหลัง (system_jobs)</h2>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft text-left text-xs text-text-muted">
              <tr><th className="px-3 py-2">Job</th><th className="px-3 py-2">สถานะ</th><th className="px-3 py-2">ล่าสุด</th></tr>
            </thead>
            <tbody>
              {d.jobs.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-3 text-text-muted">ยังไม่มีการรันงาน</td></tr>
              ) : (
                d.jobs.map((j) => (
                  <tr key={j.id} className="border-t border-line">
                    <td className="px-3 py-2">{j.name}</td>
                    <td className="px-3 py-2">{j.status}</td>
                    <td className="px-3 py-2 text-text-muted">{j.lastRunAt ? new Date(j.lastRunAt).toLocaleString("th-TH") : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-dark">กิจกรรมล่าสุด (admin_audit_logs)</h2>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft text-left text-xs text-text-muted">
              <tr><th className="px-3 py-2">เวลา</th><th className="px-3 py-2">ผู้ใช้</th><th className="px-3 py-2">การกระทำ</th><th className="px-3 py-2">เอนทิตี</th></tr>
            </thead>
            <tbody>
              {d.audits.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-3 text-text-muted">ยังไม่มีกิจกรรม</td></tr>
              ) : (
                d.audits.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-3 py-2 text-text-muted">{new Date(a.createdAt).toLocaleString("th-TH")}</td>
                    <td className="px-3 py-2">{a.actor?.email ?? "—"}</td>
                    <td className="px-3 py-2">{a.action}</td>
                    <td className="px-3 py-2 text-text-muted">{a.entityType}{a.entityId ? `:${a.entityId.slice(0, 8)}` : ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
