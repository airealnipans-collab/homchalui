"use client";
// apps/web/components/admin/TranslationCell.tsx — one locale cell in the matrix. Powered by 2T9COME.
// Existing translation → status dropdown (PATCH). Missing en/zh → "generate draft" (POST).
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@homchalui/i18n";
import type { TranslationEntityType, TranslationStatusValue } from "@homchalui/validators";

const SETTABLE: TranslationStatusValue[] = ["draft", "needs_review", "approved", "published", "outdated"];
const COLOR: Record<string, string> = {
  missing: "bg-line text-text-muted",
  draft: "bg-warning/15 text-warning",
  machine_translated: "bg-lavender/40 text-brand-dark",
  needs_review: "bg-gold/20 text-brand-dark",
  approved: "bg-sage/30 text-brand-dark",
  published: "bg-success/15 text-success",
  outdated: "bg-error/15 text-error",
};

export function TranslationCell({
  entityType,
  entityId,
  locale,
  cell,
}: {
  entityType: TranslationEntityType;
  entityId: string;
  locale: Locale;
  cell: { id: string | null; status: TranslationStatusValue };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/translations/${cell.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType, status }),
    });
    setBusy(false);
    if (res.ok) return router.refresh();
    const body = await res.json().catch(() => null);
    setError(body?.error?.message ?? "ผิดพลาด");
  }

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/translations/generate-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entityType, entityId, targetLocale: locale }),
    });
    setBusy(false);
    if (res.ok) return router.refresh();
    const body = await res.json().catch(() => null);
    setError(body?.error?.message ?? "ผิดพลาด");
  }

  if (!cell.id) {
    return (
      <div className="space-y-1">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${COLOR.missing}`}>missing</span>
        {locale !== "th" && (
          <button type="button" onClick={generate} disabled={busy} className="block text-xs text-brand hover:underline disabled:opacity-50">
            + สร้างฉบับร่าง (MT)
          </button>
        )}
        {error && <p className="text-[11px] text-error">{error}</p>}
      </div>
    );
  }

  const options = [cell.status, ...SETTABLE.filter((s) => s !== cell.status)];
  return (
    <div className="space-y-1">
      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${COLOR[cell.status] ?? ""}`}>{cell.status}</span>
      <select
        value={cell.status}
        disabled={busy}
        onChange={(e) => setStatus(e.target.value)}
        className="block w-full rounded border border-line bg-card px-1 py-1 text-[11px] outline-none focus:border-brand"
      >
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  );
}
