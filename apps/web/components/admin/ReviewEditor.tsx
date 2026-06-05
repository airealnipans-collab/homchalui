"use client";
// apps/web/components/admin/ReviewEditor.tsx — create/edit a review. หอมฉลุย — Powered by 2T9COME.
// Integrity (CLAUDE.md §2.6): no fake reviews (reminder shown); `tested` requires an explicit
// confirm checkbox; `sponsored` is stored and labeled on the front. Validated with reviewCreate.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { reviewCreate } from "@homchalui/validators";

interface RVals {
  productId: string; locale: "th" | "en" | "zh"; title: string; body: string; reviewer: string;
  rating: string; pros: string; cons: string; bestFor: string; notFor: string;
  tested: boolean; sponsored: boolean; published: boolean;
}

export interface ReviewEditorInitial {
  productId: string; locale: string; title: string; body: string; reviewer: string;
  rating: number; pros: string[]; cons: string[]; bestFor: string; notFor: string;
  tested: boolean; sponsored: boolean; published: boolean;
}

const csv = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);
const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";

function toDefaults(initial: ReviewEditorInitial | null, productId?: string): RVals {
  if (!initial) {
    return {
      productId: productId ?? "", locale: "th", title: "", body: "", reviewer: "",
      rating: "5", pros: "", cons: "", bestFor: "", notFor: "", tested: false, sponsored: false, published: false,
    };
  }
  return {
    productId: initial.productId, locale: initial.locale as RVals["locale"], title: initial.title, body: initial.body,
    reviewer: initial.reviewer, rating: String(initial.rating), pros: initial.pros.join(", "), cons: initial.cons.join(", "),
    bestFor: initial.bestFor, notFor: initial.notFor, tested: initial.tested, sponsored: initial.sponsored, published: initial.published,
  };
}

export function ReviewEditor({
  reviewId,
  initial,
  products,
}: {
  reviewId?: string;
  initial: ReviewEditorInitial | null;
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const isNew = !reviewId;
  const { register, getValues, watch } = useForm<RVals>({ defaultValues: toDefaults(initial) });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testedConfirm, setTestedConfirm] = useState(initial?.tested ?? false);
  const testedChecked = watch("tested");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = getValues();

    if (v.tested && !testedConfirm) {
      setError("กรุณายืนยันว่าทดลองใช้จริงก่อนทำเครื่องหมาย 'tested'");
      return;
    }

    const payload = {
      productId: v.productId,
      locale: v.locale,
      title: v.title,
      body: v.body,
      reviewer: v.reviewer || undefined,
      rating: v.rating === "" ? 0 : Number(v.rating),
      pros: csv(v.pros),
      cons: csv(v.cons),
      bestFor: v.bestFor || undefined,
      notFor: v.notFor || undefined,
      tested: v.tested,
      sponsored: v.sponsored,
      published: v.published,
    };

    const parsed = reviewCreate.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      setError(first ? `${first.path.join(".")}: ${first.message}` : "ตรวจสอบข้อมูลไม่ผ่าน");
      return;
    }

    setSaving(true);
    const res = await fetch(isNew ? "/api/admin/reviews" : `/api/admin/reviews/${reviewId}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/reviews");
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => null);
    setError(body?.error?.message ?? `บันทึกไม่สำเร็จ (${res.status})`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-dark">{isNew ? "เพิ่มรีวิว" : "แก้ไขรีวิว"}</h1>
        <button type="submit" disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>

      <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
        นโยบายความซื่อตรง: ห้ามสร้างรีวิวปลอม • ทำเครื่องหมาย “ทดลองใช้จริง” เฉพาะเมื่อทดสอบเองจริง ๆ • รีวิวที่ได้รับการสนับสนุนต้องติดป้าย “sponsored”
      </p>

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

      <div className="grid gap-4 rounded-2xl border border-line bg-card p-4 md:grid-cols-2">
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">สินค้า</span>
          <select className={field} {...register("productId")} disabled={!isNew}>
            <option value="">— เลือก —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ภาษา</span>
          <select className={field} {...register("locale")} disabled={!isNew}>
            <option value="th">th</option><option value="en">en</option><option value="zh">zh</option>
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">หัวข้อ</span><input className={field} {...register("title")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ผู้รีวิว</span><input className={field} {...register("reviewer")} /></label>
        <label className="block md:col-span-2"><span className="mb-1 block text-xs text-text-secondary">เนื้อหา</span><textarea rows={4} className={field} {...register("body")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">คะแนน (0–5)</span><input type="number" step="0.1" min={0} max={5} className={field} {...register("rating")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ข้อดี (คั่นด้วย ,)</span><input className={field} {...register("pros")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ข้อสังเกต (คั่นด้วย ,)</span><input className={field} {...register("cons")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">เหมาะกับ</span><input className={field} {...register("bestFor")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ไม่เหมาะกับ</span><input className={field} {...register("notFor")} /></label>
      </div>

      <div className="space-y-2 rounded-2xl border border-line bg-card p-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" {...register("tested")} /> ทดลองใช้จริง (tested)</label>
        {testedChecked && (
          <label className="ml-6 flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={testedConfirm} onChange={(e) => setTestedConfirm(e.target.checked)} />
            ยืนยันว่าทดลองใช้จริง
          </label>
        )}
        <label className="flex items-center gap-2"><input type="checkbox" {...register("sponsored")} /> ได้รับการสนับสนุน (sponsored)</label>
        <label className="flex items-center gap-2"><input type="checkbox" {...register("published")} /> เผยแพร่ (published)</label>
      </div>
    </form>
  );
}
