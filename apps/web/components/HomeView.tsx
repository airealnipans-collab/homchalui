// apps/web/components/HomeView.tsx — home, driven by the Layout Builder. หอมฉลุย — Powered by 2T9COME.
// Renders the published `home` layout for the locale; falls back to a default hero + latest grid
// when no layout row exists (so the home is never blank).
import { localizedPath, type Locale } from "@homchalui/i18n";
import { ProductGrid } from "@homchalui/ui";
import { getLayoutSections } from "@/lib/layout";
import { listProducts } from "@/lib/listing";
import { resolveListQuery } from "@/lib/list-page";
import { getSessionId } from "@/lib/session";
import { LayoutSectionRenderer } from "./LayoutSectionRenderer";

const HERO: Record<Locale, { title: string; subtitle: string; latest: string }> = {
  th: { title: "หอมฉลุย", subtitle: "รีวิว เปรียบเทียบ และเลือกของหอมที่ใช่ แล้วกดไปซื้อผ่านร้านที่ต้องการ", latest: "รีวิวล่าสุด" },
  en: { title: "Homchalui", subtitle: "Review, compare and pick the right scent — then buy from the store you prefer.", latest: "Latest reviews" },
  zh: { title: "Homchalui 香氛", subtitle: "评测、对比并挑选适合你的香氛 — 然后在你喜欢的商店购买。", latest: "最新评测" },
};

export async function HomeView({ locale }: { locale: Locale }) {
  const sessionId = getSessionId();
  const sections = await getLayoutSections("home", locale);

  if (sections && sections.length > 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <LayoutSectionRenderer sections={sections} locale={locale} sessionId={sessionId} />
      </main>
    );
  }

  // Fallback: default hero + latest products.
  const hero = HERO[locale];
  const { items } = await listProducts({ ...resolveListQuery({}, { locale }), limit: 12 });
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-3xl bg-lavender/40 p-8">
        <h1 className="text-3xl font-semibold text-brand-dark">{hero.title}</h1>
        <p className="mt-2 text-text-secondary">{hero.subtitle}</p>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-brand-dark">{hero.latest}</h2>
        <ProductGrid items={items} locale={locale} listName="home:latest" sessionId={sessionId} />
      </section>
    </main>
  );
}
