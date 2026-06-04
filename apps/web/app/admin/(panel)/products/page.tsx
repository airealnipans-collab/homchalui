// apps/web/app/admin/(panel)/products/page.tsx — product list. หอมฉลุย — Powered by 2T9COME.
import Link from "next/link";
import { listProductsAdmin } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-success/15 text-success",
  draft: "bg-warning/15 text-warning",
  archived: "bg-line text-text-muted",
};

export default async function AdminProductsPage() {
  const items = await listProductsAdmin();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-dark">สินค้า</h1>
        <Link href="/admin/products/new" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">
          + เพิ่มสินค้า
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft text-left text-xs text-text-muted">
            <tr>
              <th className="px-3 py-2">ชื่อ (ไทย)</th>
              <th className="px-3 py-2">แบรนด์</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">ภาษา</th>
              <th className="px-3 py-2">ลิงก์ร้าน</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-text-muted">ยังไม่มีสินค้า</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-bg-soft">
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-brand hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{p.brand ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLE[p.status] ?? ""}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2 text-text-muted">{p.locales.join(", ")}</td>
                  <td className="px-3 py-2 text-text-muted">{p.merchantLinks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
