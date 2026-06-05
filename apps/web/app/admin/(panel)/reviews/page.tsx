// apps/web/app/admin/(panel)/reviews/page.tsx — review list. หอมฉลุย — Powered by 2T9COME.
import Link from "next/link";
import { listReviewsAdmin } from "@/lib/admin-reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const items = await listReviewsAdmin();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-dark">รีวิว</h1>
        <Link href="/admin/reviews/new" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">+ เพิ่มรีวิว</Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft text-left text-xs text-text-muted">
            <tr>
              <th className="px-3 py-2">หัวข้อ</th>
              <th className="px-3 py-2">สินค้า</th>
              <th className="px-3 py-2">ภาษา</th>
              <th className="px-3 py-2">คะแนน</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">ป้าย</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-text-muted">ยังไม่มีรีวิว</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-bg-soft">
                  <td className="px-3 py-2"><Link href={`/admin/reviews/${r.id}`} className="font-medium text-brand hover:underline">{r.title}</Link></td>
                  <td className="px-3 py-2 text-text-secondary">{r.product}</td>
                  <td className="px-3 py-2 text-text-muted">{r.locale}</td>
                  <td className="px-3 py-2">★ {r.rating}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${r.published ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {r.published ? "published" : "draft"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px]">
                    {r.tested && <span className="mr-1 rounded-full bg-success/15 px-2 py-0.5 text-success">tested</span>}
                    {r.sponsored && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-warning">sponsored</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
