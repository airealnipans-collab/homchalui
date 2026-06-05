"use client";
// apps/web/components/admin/LayoutBuilderEditor.tsx — Layout Builder. หอมฉลุย — Powered by 2T9COME.
// Edit a page's sections: add/remove/reorder (up/down), toggle active, edit per-type config (JSON),
// set draft/published. Validated with layoutUpsert (per-type config) before POST /api/admin/layout.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { SECTION_TYPES, layoutUpsert, type SectionType } from "@homchalui/validators";
import type { LayoutEdit } from "@/lib/admin-layout";

interface Row {
  type: SectionType;
  isActive: boolean;
  configText: string;
}

const DEFAULTS: Record<SectionType, unknown> = {
  hero: { title: "หัวข้อหลัก", subtitle: "คำโปรย" },
  product_carousel: { title: "สินค้ามาแรง", source: "trending", limit: 12 },
  category_grid: { title: "หมวดหมู่", limit: 12 },
  trending_list: { title: "กำลังมาแรง", limit: 12 },
  editorial_picks: { title: "คัดสรรโดยทีมงาน", campaignTag: "best-clean", limit: 12 },
  article_block: { title: "บทความ", kind: "article", limit: 6 },
  custom_html: { html: "<p>เนื้อหา HTML</p>" },
};

const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";

export function LayoutBuilderEditor({ initial }: { initial: LayoutEdit }) {
  const router = useRouter();
  const [status, setStatus] = useState<"draft" | "published">(initial.status);
  const [rows, setRows] = useState<Row[]>(
    initial.sections.map((s) => ({ type: s.type as SectionType, isActive: s.isActive, configText: JSON.stringify(s.config, null, 2) })),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addType, setAddType] = useState<SectionType>("hero");

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setRows(next);
  }
  function add() {
    setRows([...rows, { type: addType, isActive: true, configText: JSON.stringify(DEFAULTS[addType], null, 2) }]);
  }
  function remove(i: number) {
    setRows(rows.filter((_, k) => k !== i));
  }
  function patch(i: number, p: Partial<Row>) {
    setRows(rows.map((r, k) => (k === i ? { ...r, ...p } : r)));
  }

  async function save() {
    setError(null);
    const sections: { type: SectionType; sortOrder: number; isActive: boolean; config: unknown }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      let config: unknown;
      try {
        config = JSON.parse(r.configText);
      } catch {
        setError(`section #${i + 1} (${r.type}): config ไม่ใช่ JSON ที่ถูกต้อง`);
        return;
      }
      sections.push({ type: r.type, sortOrder: i, isActive: r.isActive, config });
    }

    const payload = { key: initial.key, locale: initial.locale, status, sections };
    const parsed = layoutUpsert.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      setError(first ? `${first.path.join(".")}: ${first.message}` : "ตรวจสอบข้อมูลไม่ผ่าน");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/layout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => null);
    setError(body?.error?.message ?? `บันทึกไม่สำเร็จ (${res.status})`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-dark">Layout Builder — {initial.key} / {initial.locale}</h1>
        <div className="flex items-center gap-3">
          <a href={localizedPath(initial.locale, "/")} target="_blank" rel="noreferrer" className="text-sm text-text-secondary underline">ดูตัวอย่าง ↗</a>
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="rounded-lg border border-line px-3 py-1.5 text-sm">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-text-muted">ยังไม่มี section — เพิ่มด้านล่าง</p>}
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs font-medium">{i + 1}. {r.type}</span>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1"><input type="checkbox" checked={r.isActive} onChange={(e) => patch(i, { isActive: e.target.checked })} /> active</label>
                <button type="button" onClick={() => move(i, -1)} className="rounded border border-line px-2">↑</button>
                <button type="button" onClick={() => move(i, 1)} className="rounded border border-line px-2">↓</button>
                <button type="button" onClick={() => remove(i)} className="rounded border border-line px-2 text-error">ลบ</button>
              </div>
            </div>
            <textarea
              value={r.configText}
              onChange={(e) => patch(i, { configText: e.target.value })}
              rows={Math.min(10, r.configText.split("\n").length + 1)}
              className={`${field} font-mono text-xs`}
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <select value={addType} onChange={(e) => setAddType(e.target.value as SectionType)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
          {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={add} className="rounded-full border border-line px-4 py-1.5 text-sm">+ เพิ่ม section</button>
      </div>
    </div>
  );
}
