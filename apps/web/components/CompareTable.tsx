// apps/web/components/CompareTable.tsx — side-by-side comparison. หอมฉลุย — Powered by 2T9COME.
// Server, presentational. Transposed: attribute rows × product columns. 2–4 products.
import { type Locale } from "@homchalui/i18n";
import { formatPrice } from "@homchalui/ui";
import type { CompareProduct } from "@/lib/compare";

const T = {
  price: { th: "ราคา", en: "Price", zh: "价格" },
  cheapest: { th: "ราคาร้านถูกสุด", en: "Cheapest merchant", zh: "最低商家价" },
  rating: { th: "คะแนนรีวิว", en: "Rating", zh: "评分" },
  scentFamily: { th: "ตระกูลกลิ่น", en: "Scent family", zh: "香调" },
  notes: { th: "โน้ตกลิ่น", en: "Notes", zh: "香调音符" },
  pros: { th: "ข้อดี", en: "Pros", zh: "优点" },
  cons: { th: "ข้อสังเกต", en: "Cons", zh: "缺点" },
  view: { th: "ดูรีวิว", en: "View", zh: "查看" },
} satisfies Record<string, Record<Locale, string>>;

const SCORE_ROWS: { key: string; label: Record<Locale, string> }[] = [
  { key: "longevity", label: { th: "ความติดทน", en: "Longevity", zh: "持久度" } },
  { key: "projection", label: { th: "การกระจาย", en: "Projection", zh: "扩散度" } },
  { key: "value", label: { th: "ความคุ้มค่า", en: "Value", zh: "性价比" } },
  { key: "sweetness", label: { th: "ความหวาน", en: "Sweetness", zh: "甜度" } },
  { key: "freshness", label: { th: "ความสดชื่น", en: "Freshness", zh: "清新度" } },
  { key: "luxury", label: { th: "ความหรู", en: "Luxury", zh: "奢华度" } },
  { key: "beginnerFriendly", label: { th: "เหมาะมือใหม่", en: "Beginner-friendly", zh: "新手友好" } },
];

function priceRange(p: CompareProduct, locale: Locale): string {
  if (p.priceMin == null) return "—";
  const lo = formatPrice(p.priceMin, p.currency, locale);
  if (p.priceMax != null && p.priceMax !== p.priceMin) return `${lo} – ${formatPrice(p.priceMax, p.currency, locale)}`;
  return lo;
}

export function CompareTable({ products, locale }: { products: CompareProduct[]; locale: Locale }) {
  const th = "border border-line p-2 text-left align-top text-xs font-medium text-text-secondary";
  const td = "border border-line p-2 align-top text-sm";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className={`${th} sticky left-0 bg-bg-soft`} />
            {products.map((p) => (
              <th key={p.id} className="border border-line p-2 align-top">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="mb-2 aspect-square w-full max-w-[120px] rounded-lg object-cover" />
                )}
                <a href={p.href} className="block text-sm font-medium text-brand hover:underline">{p.name}</a>
                <span className="text-xs text-text-muted">{p.brand}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr><th className={th}>{T.price[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{priceRange(p, locale)}</td>)}</tr>
          <tr><th className={th}>{T.cheapest[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{p.merchantMinPrice != null ? formatPrice(p.merchantMinPrice, p.currency, locale) : "—"}</td>)}</tr>
          <tr><th className={th}>{T.rating[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{p.rating ? `★ ${p.rating.value} (${p.rating.count})` : "—"}</td>)}</tr>
          {SCORE_ROWS.map((row) => (
            <tr key={row.key}>
              <th className={th}>{row.label[locale]}</th>
              {products.map((p) => <td key={p.id} className={td}>{p.scores?.[row.key] != null ? p.scores[row.key] : "—"}</td>)}
            </tr>
          ))}
          <tr><th className={th}>{T.scentFamily[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{p.scentFamily ?? "—"}</td>)}</tr>
          <tr><th className={th}>{T.notes[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{p.notes.length ? p.notes.join(", ") : "—"}</td>)}</tr>
          <tr><th className={th}>{T.pros[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{p.pros.length ? <ul className="list-disc pl-4">{p.pros.map((x, i) => <li key={i}>{x}</li>)}</ul> : "—"}</td>)}</tr>
          <tr><th className={th}>{T.cons[locale]}</th>{products.map((p) => <td key={p.id} className={td}>{p.cons.length ? <ul className="list-disc pl-4">{p.cons.map((x, i) => <li key={i}>{x}</li>)}</ul> : "—"}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
