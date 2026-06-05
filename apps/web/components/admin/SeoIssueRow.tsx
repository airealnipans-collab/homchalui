"use client";
// apps/web/components/admin/SeoIssueRow.tsx — inline SEO fix + Google preview. หอมฉลุย — Powered by 2T9COME.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SeoEntityType } from "@homchalui/validators";

export interface SeoIssueRowData {
  entityType: SeoEntityType;
  id: string;
  name: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  missing: string[];
}

const TYPE_PATH: Record<SeoEntityType, string> = { product: "product", article: "article", category: "category" };
const field = "w-full rounded-lg border border-line bg-card px-2 py-1.5 text-sm outline-none focus:border-brand";

export function SeoIssueRow({ issue, locale }: { issue: SeoIssueRowData; locale: string }) {
  const router = useRouter();
  const [seoTitle, setSeoTitle] = useState(issue.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(issue.seoDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefix = locale === "th" ? "" : `/${locale}`;
  const url = `homchalui.com${prefix}/${TYPE_PATH[issue.entityType]}/${issue.slug}`;

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/seo/${issue.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType: issue.entityType, seoTitle, seoDescription }),
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
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs">{issue.entityType}</span>
        <span className="text-sm font-medium text-text-main">{issue.name}</span>
        {issue.missing.map((m) => (
          <span key={m} className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning">missing {m}</span>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">SEO title</span><input className={field} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">SEO description</span><input className={field} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} /></label>
      </div>

      {/* Google result preview */}
      <div className="mt-3 rounded-lg bg-bg-soft p-3">
        <p className="truncate text-xs text-success">{url}</p>
        <p className="truncate text-base text-[#1a0dab]">{seoTitle || issue.name}</p>
        <p className="line-clamp-2 text-xs text-text-secondary">{seoDescription || "—"}</p>
      </div>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <div className="mt-2 text-right">
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
