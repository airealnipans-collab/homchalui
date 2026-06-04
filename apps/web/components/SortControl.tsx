"use client";
// apps/web/components/SortControl.tsx — URL-synced sort. หอมฉลุย — Powered by 2T9COME.
// Writes ?sort= (resets ?page=) and fires sort_apply with locale. See COMPONENT_LIBRARY.
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@homchalui/i18n";
import { SORTS, type Sort } from "@homchalui/validators";
import { track } from "@homchalui/ui";

const LABELS: Record<Locale, Record<Sort, string>> = {
  th: {
    recommended: "แนะนำ", trending: "มาแรง", most_clicked: "คลิกเยอะสุด", best_reviewed: "รีวิวดีสุด",
    price_asc: "ราคาน้อย→มาก", price_desc: "ราคามาก→น้อย", longevity: "ติดทนนาน", beginner: "เหมาะมือใหม่",
  },
  en: {
    recommended: "Recommended", trending: "Trending", most_clicked: "Most clicked", best_reviewed: "Best reviewed",
    price_asc: "Price: low to high", price_desc: "Price: high to low", longevity: "Longest lasting", beginner: "Beginner-friendly",
  },
  zh: {
    recommended: "推荐", trending: "热门", most_clicked: "点击最多", best_reviewed: "好评优先",
    price_asc: "价格从低到高", price_desc: "价格从高到低", longevity: "最持久", beginner: "新手友好",
  },
};
const HEADING: Record<Locale, string> = { th: "เรียงตาม", en: "Sort by", zh: "排序" };

export function SortControl({ value, locale }: { value: Sort; locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sort = e.target.value as Sort;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page"); // back to page 1 on re-sort
    track("sort_apply", locale, { sort_key: sort });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-text-secondary">
      <span className="whitespace-nowrap">{HEADING[locale]}</span>
      <select
        value={value}
        onChange={onChange}
        className="rounded-full border border-line bg-card px-3 py-1.5 text-text-main outline-none focus:border-brand"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {LABELS[locale][s]}
          </option>
        ))}
      </select>
    </label>
  );
}
