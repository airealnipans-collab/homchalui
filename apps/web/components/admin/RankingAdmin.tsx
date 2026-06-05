"use client";
// apps/web/components/admin/RankingAdmin.tsx — ranking weights/versions/recalc/preview/rollback.
// หอมฉลุย — Powered by 2T9COME. Per algorithm: edit weights → save version; recalculate; preview
// (no write); rollback to a prior version. Weights stay data-driven (ranking_configs).
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RankingKeyState } from "@/lib/admin-ranking";

const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";

function KeyBlock({ state }: { state: RankingKeyState }) {
  const router = useRouter();
  const [weights, setWeights] = useState(JSON.stringify(state.active?.weights ?? {}, null, 2));
  const [bounce, setBounce] = useState(String(state.active?.bouncePenalty ?? 0));
  const [previewLocale, setPreviewLocale] = useState<"th" | "en" | "zh">("th");
  const [preview, setPreview] = useState<{ name: string; score: number }[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setMsg(json?.error?.message ?? `ผิดพลาด (${res.status})`);
      return null;
    }
    return json;
  }

  async function saveVersion() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(weights);
    } catch {
      setMsg("weights ต้องเป็น JSON ที่ถูกต้อง");
      return;
    }
    const out = await call("/api/admin/ranking/config", "POST", { key: state.key, weights: parsed, bouncePenalty: Number(bounce) || 0, activate: true });
    if (out) {
      setMsg(`บันทึกเวอร์ชัน ${out.version} แล้ว`);
      router.refresh();
    }
  }

  async function recalc() {
    const out = await call("/api/admin/ranking/recalculate", "POST", { key: state.key });
    if (out) {
      setMsg(`คำนวณใหม่แล้ว: ${Object.entries(out.result).map(([l, n]) => `${l}=${n}`).join(", ")}`);
      router.refresh();
    }
  }

  async function doPreview() {
    const out = await call(`/api/admin/ranking/preview?key=${state.key}&locale=${previewLocale}`, "GET");
    if (out) setPreview(out.items);
  }

  async function rollback(id: string) {
    const out = await call(`/api/admin/ranking/config/${id}/rollback`, "POST");
    if (out) router.refresh();
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">{state.key}</h2>
        <span className="text-xs text-text-muted">active: v{state.active?.version ?? "—"}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs text-text-secondary">weights (JSON)</span>
          <textarea value={weights} onChange={(e) => setWeights(e.target.value)} rows={5} className={`${field} font-mono text-xs`} spellCheck={false} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">bounce penalty</span>
          <input type="number" step="0.1" value={bounce} onChange={(e) => setBounce(e.target.value)} className={field} />
        </label>
        <div className="flex items-end gap-2">
          <button type="button" onClick={saveVersion} disabled={busy} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">บันทึกเวอร์ชันใหม่</button>
          <button type="button" onClick={recalc} disabled={busy} className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50">คำนวณใหม่</button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select value={previewLocale} onChange={(e) => setPreviewLocale(e.target.value as "th" | "en" | "zh")} className="rounded-lg border border-line px-2 py-1 text-sm">
          <option value="th">th</option><option value="en">en</option><option value="zh">zh</option>
        </select>
        <button type="button" onClick={doPreview} disabled={busy} className="rounded-full border border-line px-4 py-1.5 text-sm disabled:opacity-50">พรีวิว (ไม่บันทึก)</button>
        <span className="text-xs text-text-muted">
          last: {(["th", "en", "zh"] as const).map((l) => `${l}=${state.lastComputed[l]?.count ?? 0}`).join(" ")}
        </span>
      </div>

      {msg && <p className="mt-2 text-sm text-text-secondary">{msg}</p>}

      {preview && (
        <ol className="mt-3 list-decimal space-y-0.5 rounded-lg bg-bg-soft p-3 pl-8 text-sm">
          {preview.length === 0 ? <li className="list-none text-text-muted">ไม่มีผลลัพธ์ (อาจยังไม่มีสถิติ)</li> : preview.map((p, i) => <li key={i}>{p.name} — {p.score}</li>)}
        </ol>
      )}

      {state.versions.length > 0 && (
        <div className="mt-3 text-xs">
          <p className="mb-1 text-text-muted">เวอร์ชัน:</p>
          <div className="flex flex-wrap gap-2">
            {state.versions.map((v) => (
              <span key={v.id} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${v.isActive ? "border-success text-success" : "border-line"}`}>
                v{v.version}{v.isActive ? " (active)" : ""}
                {!v.isActive && <button type="button" onClick={() => rollback(v.id)} className="text-brand hover:underline">rollback</button>}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function RankingAdmin({ state }: { state: RankingKeyState[] }) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-brand-dark">Ranking</h1>
      {state.map((s) => <KeyBlock key={s.key} state={s} />)}
    </div>
  );
}
