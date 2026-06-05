// apps/web/components/CompareView.tsx — compare page body. หอมฉลุย — Powered by 2T9COME.
// Ad-hoc ?ids= comparison (noindex — set by the page). 2–4 products; published + locale only.
import { localizedPath, type Locale } from "@homchalui/i18n";
import { Breadcrumb, type Crumb } from "@homchalui/ui";
import { getCompareProducts } from "@/lib/compare";
import { CompareTable } from "./CompareTable";
import { HOME_LABEL } from "@/lib/list-page";

const L = {
  title: { th: "เปรียบเทียบ", en: "Compare", zh: "对比" },
  empty: {
    th: "เลือกสินค้าอย่างน้อย 2 รายการเพื่อเปรียบเทียบ",
    en: "Add at least 2 products to compare.",
    zh: "请至少选择 2 件商品进行对比。",
  },
} satisfies Record<string, Record<Locale, string>>;

export async function CompareView({ ids, locale }: { ids: string[]; locale: Locale }) {
  const products = await getCompareProducts(ids, locale);
  const crumbs: Crumb[] = [
    { label: HOME_LABEL[locale], href: localizedPath(locale, "/") },
    { label: L.title[locale] },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb items={crumbs} locale={locale} />
      <h1 className="mt-3 text-2xl font-semibold text-brand-dark">{L.title[locale]}</h1>
      <div className="mt-6">
        {products.length < 2 ? (
          <p className="py-12 text-center text-sm text-text-muted">{L.empty[locale]}</p>
        ) : (
          <CompareTable products={products} locale={locale} />
        )}
      </div>
    </main>
  );
}
