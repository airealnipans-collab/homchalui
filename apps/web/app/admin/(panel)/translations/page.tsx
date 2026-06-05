// apps/web/app/admin/(panel)/translations/page.tsx — Translation Management. หอมฉลุย — Powered by 2T9COME.
// Matrix entity × {th,en,zh} with status chips + lifecycle actions. Thai = source of truth.
import { getTranslationMatrix } from "@/lib/admin-translations";
import { TranslationCell } from "@/components/admin/TranslationCell";

export const dynamic = "force-dynamic";

export default async function AdminTranslationsPage() {
  const m = await getTranslationMatrix();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-brand-dark">การจัดการคำแปล</h1>

      <div className="flex gap-4">
        {(["en", "zh"] as const).map((l) => {
          const v = m.completeness[l];
          const color = v >= 80 ? "text-success" : v >= 50 ? "text-warning" : "text-error";
          return (
            <div key={l} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-xs text-text-muted">ความครบถ้วน {l.toUpperCase()}</p>
              <p className={`text-2xl font-semibold ${color}`}>{v}%</p>
            </div>
          );
        })}
      </div>

      {m.shouldTranslateNext.length > 0 && (
        <section className="rounded-2xl border border-line bg-bg-soft p-4">
          <h2 className="mb-2 text-sm font-semibold text-brand-dark">ควรแปลถัดไป</h2>
          <ul className="space-y-1 text-sm">
            {m.shouldTranslateNext.map((s) => (
              <li key={`${s.entityType}:${s.entityId}`} className="text-text-secondary">
                <span className="rounded-full bg-card px-2 py-0.5 text-xs">{s.entityType}</span> {s.name} — ขาด: {s.missing.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-bg-soft text-left text-xs text-text-muted">
            <tr>
              <th className="px-3 py-2">เอนทิตี</th>
              <th className="px-3 py-2">TH (ต้นฉบับ)</th>
              <th className="px-3 py-2">EN</th>
              <th className="px-3 py-2">ZH</th>
            </tr>
          </thead>
          <tbody>
            {m.rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-4 text-text-muted">ยังไม่มีข้อมูล</td></tr>
            ) : (
              m.rows.map((r) => (
                <tr key={`${r.entityType}:${r.entityId}`} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <span className="mr-1 rounded-full bg-bg-soft px-2 py-0.5 text-[11px]">{r.entityType}</span>
                    <span className="text-text-main">{r.name}</span>
                  </td>
                  {(["th", "en", "zh"] as const).map((l) => (
                    <td key={l} className="px-3 py-2">
                      <TranslationCell entityType={r.entityType} entityId={r.entityId} locale={l} cell={r.statuses[l]} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
