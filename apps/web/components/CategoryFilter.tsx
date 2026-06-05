"use client";
// apps/web/components/CategoryFilter.tsx — URL-synced filter rail. หอมฉลุย — Powered by 2T9COME.
// Facets write to search params (shareable URLs), reset ?page=, and fire filter_apply with
// locale. Mobile: collapsible drawer. A focused Phase-1 facet set (price, gender, rating,
// merchant); extend per docs/COMPONENT_LIBRARY.md `CategoryFilter`.
import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@homchalui/i18n";
import { MERCHANT_KEYS } from "@homchalui/validators";
import { track } from "@homchalui/ui";

const T: Record<Locale, Record<string, string>> = {
  th: { title: "ตัวกรอง", price: "ช่วงราคา (บาท)", min: "ต่ำสุด", max: "สูงสุด", gender: "เพศ", any: "ทั้งหมด",
    men: "ผู้ชาย", women: "ผู้หญิง", unisex: "ยูนิเซ็กส์", rating: "คะแนนรีวิวขั้นต่ำ", merchant: "ร้านค้า",
    apply: "ใช้ตัวกรอง", clear: "ล้าง", up: "ขึ้นไป", scent: "ตระกูลกลิ่น", longevity: "ความติดทนขั้นต่ำ", mood: "อารมณ์" },
  en: { title: "Filters", price: "Price (THB)", min: "Min", max: "Max", gender: "Gender", any: "Any",
    men: "Men", women: "Women", unisex: "Unisex", rating: "Min rating", merchant: "Merchant",
    apply: "Apply", clear: "Clear", up: "& up", scent: "Scent family", longevity: "Min longevity", mood: "Mood" },
  zh: { title: "筛选", price: "价格 (泰铢)", min: "最低", max: "最高", gender: "性别", any: "全部",
    men: "男士", women: "女士", unisex: "中性", rating: "最低评分", merchant: "商家",
    apply: "应用", clear: "清除", up: "及以上", scent: "香调", longevity: "最低持久度", mood: "氛围" },
};
const MERCHANT_LABEL: Record<string, string> = {
  shopee: "Shopee", lazada: "Lazada", central: "Central", amazon: "Amazon", tiktok: "TikTok Shop",
  official: "Official", custom: "Other",
};

export function CategoryFilter({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = T[locale];

  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [gender, setGender] = useState(searchParams.get("gender") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "");
  const [merchant, setMerchant] = useState(searchParams.get("merchant") ?? "");
  const [scent, setScent] = useState(searchParams.get("scent") ?? "");
  const [longevity, setLongevity] = useState(searchParams.get("longevity") ?? "");
  const [mood, setMood] = useState(searchParams.get("mood") ?? "");

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    const set = (k: string, v: string) => (v ? params.set(k, v) : params.delete(k));
    set("minPrice", minPrice);
    set("maxPrice", maxPrice);
    set("gender", gender);
    set("minRating", minRating);
    set("merchant", merchant);
    set("scent", scent);
    set("longevity", longevity);
    set("mood", mood);
    params.delete("page");
    track("filter_apply", locale, {
      filter_type: "panel",
      filter_value: JSON.stringify({ minPrice, maxPrice, gender, minRating, merchant, scent, longevity, mood }),
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  function clear() {
    setMinPrice(""); setMaxPrice(""); setGender(""); setMinRating(""); setMerchant("");
    setScent(""); setLongevity(""); setMood("");
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    track("filter_apply", locale, { filter_type: "clear" });
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    setOpen(false);
  }

  const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="rounded-2xl border border-line bg-bg-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-brand-dark md:cursor-default"
      >
        <span className="flex items-center gap-2">
          <span className="ti ti-adjustments-horizontal" aria-hidden="true" /> {t.title}
        </span>
        <span className="ti ti-chevron-down md:hidden" aria-hidden="true" />
      </button>

      <div className={`${open ? "block" : "hidden"} space-y-4 px-4 pb-4 md:block`}>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-text-secondary">{t.price}</legend>
          <div className="flex items-center gap-2">
            <input type="number" min={0} inputMode="numeric" placeholder={t.min} value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)} className={field} aria-label={t.min} />
            <span className="text-text-muted">–</span>
            <input type="number" min={0} inputMode="numeric" placeholder={t.max} value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)} className={field} aria-label={t.max} />
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">{t.gender}</span>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
            <option value="">{t.any}</option>
            <option value="men">{t.men}</option>
            <option value="women">{t.women}</option>
            <option value="unisex">{t.unisex}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">{t.rating}</span>
          <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className={field}>
            <option value="">{t.any}</option>
            {[4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>★ {r} {t.up}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">{t.merchant}</span>
          <select value={merchant} onChange={(e) => setMerchant(e.target.value)} className={field}>
            <option value="">{t.any}</option>
            {MERCHANT_KEYS.map((m) => (
              <option key={m} value={m}>{MERCHANT_LABEL[m]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">{t.scent}</span>
          <input value={scent} onChange={(e) => setScent(e.target.value)} placeholder="woody, fresh-floral…" className={field} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">{t.longevity}</span>
          <select value={longevity} onChange={(e) => setLongevity(e.target.value)} className={field}>
            <option value="">{t.any}</option>
            {[8, 7, 6, 5].map((n) => <option key={n} value={n}>{n} {t.up}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-secondary">{t.mood}</span>
          <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="clean, calm…" className={field} />
        </label>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={apply}
            className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">{t.apply}</button>
          <button type="button" onClick={clear}
            className="rounded-full border border-line px-4 py-2 text-sm text-text-secondary">{t.clear}</button>
        </div>
      </div>
    </div>
  );
}
