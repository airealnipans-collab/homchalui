"use client";
// apps/web/components/admin/ProductEditor.tsx — create/edit a product. หอมฉลุย — Powered by 2T9COME.
// RHF for structure (base + per-locale translations field array + scores + scent), validated with
// the shared Zod schema (productCreate) on submit, then POST (create) / PATCH (update). Publish
// rules + unique (locale, slug) + price order are enforced by the schema/server (errors surfaced).
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { productCreate, SCORE_KEYS } from "@homchalui/validators";

type Loc = "th" | "en" | "zh";
type TStatus = "draft" | "needs_review" | "approved" | "published";

interface TrRow {
  locale: Loc; name: string; slug: string; shortDescription: string; reviewSummary: string;
  seoTitle: string; seoDescription: string; aeoSummary: string; translationStatus: TStatus;
}
interface EditorValues {
  brandId: string; primaryCategoryId: string; status: "draft" | "published" | "archived"; currency: string;
  priceMin: string; priceMax: string; mainImageUrl: string; campaignTag: string;
  manualBoost: string; manualPin: boolean; excludeFromRanking: boolean;
  scores: Record<(typeof SCORE_KEYS)[number], string>;
  scent: { scentFamily: string; genderTarget: string; mood: string; season: string; occasion: string; topNotes: string; middleNotes: string; baseNotes: string };
  translations: TrRow[];
}

export interface ProductEditorInitial {
  brandId: string; primaryCategoryId: string; status: string; currency: string;
  priceMin: number | null; priceMax: number | null; mainImageUrl: string | null; campaignTag: string | null;
  manualBoost: number; manualPin: boolean; excludeFromRanking: boolean;
  scores: Partial<Record<(typeof SCORE_KEYS)[number], number>> | null;
  scentProfile: { scentFamily: string | null; genderTarget: string | null; mood: string[]; season: string[]; occasion: string[]; topNotes: string[]; middleNotes: string[]; baseNotes: string[] } | null;
  translations: TrRow[];
}

const csv = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);
const blankScores = () => Object.fromEntries(SCORE_KEYS.map((k) => [k, ""])) as Record<(typeof SCORE_KEYS)[number], string>;
const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";

function emptyTr(locale: Loc): TrRow {
  return { locale, name: "", slug: "", shortDescription: "", reviewSummary: "", seoTitle: "", seoDescription: "", aeoSummary: "", translationStatus: "draft" };
}

function toDefaults(initial: ProductEditorInitial | null): EditorValues {
  if (!initial) {
    return {
      brandId: "", primaryCategoryId: "", status: "draft", currency: "THB",
      priceMin: "", priceMax: "", mainImageUrl: "", campaignTag: "",
      manualBoost: "0", manualPin: false, excludeFromRanking: false,
      scores: blankScores(),
      scent: { scentFamily: "", genderTarget: "", mood: "", season: "", occasion: "", topNotes: "", middleNotes: "", baseNotes: "" },
      translations: [emptyTr("th")],
    };
  }
  const scores = blankScores();
  for (const k of SCORE_KEYS) if (initial.scores?.[k] != null) scores[k] = String(initial.scores[k]);
  const sp = initial.scentProfile;
  return {
    brandId: initial.brandId, primaryCategoryId: initial.primaryCategoryId, status: initial.status as EditorValues["status"], currency: initial.currency,
    priceMin: initial.priceMin?.toString() ?? "", priceMax: initial.priceMax?.toString() ?? "",
    mainImageUrl: initial.mainImageUrl ?? "", campaignTag: initial.campaignTag ?? "",
    manualBoost: String(initial.manualBoost ?? 0), manualPin: initial.manualPin, excludeFromRanking: initial.excludeFromRanking,
    scores,
    scent: {
      scentFamily: sp?.scentFamily ?? "", genderTarget: sp?.genderTarget ?? "",
      mood: sp?.mood.join(", ") ?? "", season: sp?.season.join(", ") ?? "", occasion: sp?.occasion.join(", ") ?? "",
      topNotes: sp?.topNotes.join(", ") ?? "", middleNotes: sp?.middleNotes.join(", ") ?? "", baseNotes: sp?.baseNotes.join(", ") ?? "",
    },
    translations: initial.translations.length ? initial.translations : [emptyTr("th")],
  };
}

export function ProductEditor({
  productId,
  initial,
  brands,
  categories,
}: {
  productId?: string;
  initial: ProductEditorInitial | null;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const isNew = !productId;
  const { register, control, getValues } = useForm<EditorValues>({ defaultValues: toDefaults(initial) });
  const { fields, append, remove } = useFieldArray({ control, name: "translations" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = getValues();
    const scores: Record<string, number> = {};
    for (const k of SCORE_KEYS) if (v.scores[k] !== "") scores[k] = Number(v.scores[k]);

    const payload = {
      brandId: v.brandId,
      primaryCategoryId: v.primaryCategoryId,
      status: v.status,
      currency: v.currency,
      priceMin: v.priceMin === "" ? null : Number(v.priceMin),
      priceMax: v.priceMax === "" ? null : Number(v.priceMax),
      mainImageUrl: v.mainImageUrl || null,
      manualBoost: v.manualBoost === "" ? 0 : Number(v.manualBoost),
      manualPin: v.manualPin,
      excludeFromRanking: v.excludeFromRanking,
      campaignTag: v.campaignTag || null,
      scores: Object.keys(scores).length ? scores : undefined,
      scentProfile: {
        scentFamily: v.scent.scentFamily || undefined,
        genderTarget: v.scent.genderTarget || undefined,
        mood: csv(v.scent.mood), season: csv(v.scent.season), occasion: csv(v.scent.occasion),
        topNotes: csv(v.scent.topNotes), middleNotes: csv(v.scent.middleNotes), baseNotes: csv(v.scent.baseNotes),
      },
      translations: v.translations.map((t) => ({
        locale: t.locale, name: t.name, slug: t.slug,
        shortDescription: t.shortDescription || undefined,
        reviewSummary: t.reviewSummary || undefined,
        seoTitle: t.seoTitle || undefined, seoDescription: t.seoDescription || undefined,
        aeoSummary: t.aeoSummary || undefined, translationStatus: t.translationStatus,
        pros: [], cons: [],
      })),
    };

    const parsed = productCreate.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      setError(first ? `${first.path.join(".")}: ${first.message}` : "ตรวจสอบข้อมูลไม่ผ่าน");
      return;
    }

    setSaving(true);
    const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${productId}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => null);
    setError(body?.error?.message ?? `บันทึกไม่สำเร็จ (${res.status})`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-dark">{isNew ? "เพิ่มสินค้า" : "แก้ไขสินค้า"}</h1>
        <button type="submit" disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

      {/* Basic */}
      <section className="grid gap-4 rounded-2xl border border-line bg-card p-4 md:grid-cols-2">
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">แบรนด์</span>
          <select className={field} {...register("brandId")}><option value="">— เลือก —</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">หมวดหมู่หลัก</span>
          <select className={field} {...register("primaryCategoryId")}><option value="">— เลือก —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">สถานะ</span>
          <select className={field} {...register("status")}><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select>
        </label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">รูปหลัก (URL)</span><input className={field} {...register("mainImageUrl")} placeholder="https://…" /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ราคาต่ำสุด</span><input type="number" step="0.01" className={field} {...register("priceMin")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ราคาสูงสุด</span><input type="number" step="0.01" className={field} {...register("priceMax")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">สกุลเงิน</span><input className={field} {...register("currency")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">campaign tag</span><input className={field} {...register("campaignTag")} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("manualPin")} /> ปักหมุด (manual pin)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("excludeFromRanking")} /> ไม่รวมในการจัดอันดับ</label>
      </section>

      {/* Translations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-dark">คำแปลต่อภาษา</h2>
          <button type="button" onClick={() => append(emptyTr("en"))} className="rounded-full border border-line px-3 py-1 text-xs">+ เพิ่มภาษา</button>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs text-text-secondary">ภาษา</span>
              <select className={field} {...register(`translations.${i}.locale` as const)}><option value="th">th</option><option value="en">en</option><option value="zh">zh</option></select>
            </label>
            <label className="block"><span className="mb-1 block text-xs text-text-secondary">สถานะคำแปล</span>
              <select className={field} {...register(`translations.${i}.translationStatus` as const)}><option value="draft">draft</option><option value="needs_review">needs_review</option><option value="approved">approved</option><option value="published">published</option></select>
            </label>
            <label className="block"><span className="mb-1 block text-xs text-text-secondary">ชื่อ</span><input className={field} {...register(`translations.${i}.name` as const)} /></label>
            <label className="block"><span className="mb-1 block text-xs text-text-secondary">slug (kebab-case)</span><input className={field} {...register(`translations.${i}.slug` as const)} /></label>
            <label className="block md:col-span-2"><span className="mb-1 block text-xs text-text-secondary">คำอธิบายสั้น (จำเป็นเมื่อ publish)</span><input className={field} {...register(`translations.${i}.shortDescription` as const)} /></label>
            <label className="block md:col-span-2"><span className="mb-1 block text-xs text-text-secondary">สรุปรีวิว</span><textarea rows={2} className={field} {...register(`translations.${i}.reviewSummary` as const)} /></label>
            <label className="block"><span className="mb-1 block text-xs text-text-secondary">SEO title</span><input className={field} {...register(`translations.${i}.seoTitle` as const)} /></label>
            <label className="block"><span className="mb-1 block text-xs text-text-secondary">SEO description</span><input className={field} {...register(`translations.${i}.seoDescription` as const)} /></label>
            <label className="block md:col-span-2"><span className="mb-1 block text-xs text-text-secondary">AEO summary</span><textarea rows={2} className={field} {...register(`translations.${i}.aeoSummary` as const)} /></label>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="justify-self-start text-xs text-error">ลบภาษานี้</button>
            )}
          </div>
        ))}
      </section>

      {/* Scores */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-brand-dark">คะแนน (0–10)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {SCORE_KEYS.map((k) => (
            <label key={k} className="block"><span className="mb-1 block text-xs text-text-secondary">{k}</span>
              <input type="number" step="0.1" min={0} max={10} className={field} {...register(`scores.${k}` as const)} />
            </label>
          ))}
        </div>
      </section>

      {/* Scent profile */}
      <section className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold text-brand-dark">โปรไฟล์กลิ่น</h2>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">ตระกูลกลิ่น (scent family)</span><input className={field} {...register("scent.scentFamily")} placeholder="woody, fresh-floral…" /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">เพศ (gender target)</span><input className={field} {...register("scent.genderTarget")} placeholder="unisex / men / women" /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">mood (คั่นด้วย ,)</span><input className={field} {...register("scent.mood")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">season (คั่นด้วย ,)</span><input className={field} {...register("scent.season")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">occasion (คั่นด้วย ,)</span><input className={field} {...register("scent.occasion")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">top notes (คั่นด้วย ,)</span><input className={field} {...register("scent.topNotes")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">middle notes (คั่นด้วย ,)</span><input className={field} {...register("scent.middleNotes")} /></label>
        <label className="block"><span className="mb-1 block text-xs text-text-secondary">base notes (คั่นด้วย ,)</span><input className={field} {...register("scent.baseNotes")} /></label>
      </section>
    </form>
  );
}
