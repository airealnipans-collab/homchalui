// packages/ui/src/ProductGrid.tsx — responsive product grid. หอมฉลุย — Powered by 2T9COME.
// Server component; embeds the client ListTracker that fires view_item_list on view.
import type { Locale } from "@homchalui/i18n";
import type { ProductCardVM } from "@homchalui/validators";
import { ProductCard } from "./ProductCard";
import { ListTracker } from "./ListTracker";

const EMPTY: Record<Locale, string> = {
  th: "ไม่พบสินค้า ลองปรับตัวกรองดูนะ",
  en: "No products found — try adjusting the filters.",
  zh: "未找到商品，请调整筛选条件。",
};

interface Props {
  items: ProductCardVM[];
  locale: Locale;
  listName: string;
  sessionId?: string;
  emptyMessage?: string;
}

export function ProductGrid({ items, locale, listName, sessionId, emptyMessage }: Props) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-text-muted">{emptyMessage ?? EMPTY[locale]}</p>;
  }
  return (
    <>
      <ListTracker locale={locale} listName={listName} count={items.length} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            locale={locale}
            listName={listName}
            position={i + 1}
            sessionId={sessionId}
          />
        ))}
      </div>
    </>
  );
}
