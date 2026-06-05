// apps/web/components/BestView.tsx — curated "best of" list view. หอมฉลุย — Powered by 2T9COME.
// Shared by /best/[slug] (th) + /[locale]/best/[slug]. ItemList + BreadcrumbList JSON-LD.
import { notFound } from "next/navigation";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { Breadcrumb, ProductGrid, type Crumb } from "@homchalui/ui";
import { getBestList } from "@/lib/best";
import { breadcrumbLd, itemListLd, ld } from "@/lib/seo/jsonld";
import { getSessionId } from "@/lib/session";
import { HOME_LABEL } from "@/lib/list-page";

const BEST_LABEL: Record<Locale, string> = { th: "ลิสต์แนะนำ", en: "Best of", zh: "精选榜单" };

export async function BestView({ slug, locale }: { slug: string; locale: Locale }) {
  const list = await getBestList(slug, locale);
  if (!list) notFound();
  const sessionId = getSessionId();
  const crumbs: Crumb[] = [
    { label: HOME_LABEL[locale], href: localizedPath(locale, "/") },
    { label: BEST_LABEL[locale] },
    { label: list.title },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd(crumbs), itemListLd(list.items, locale, list.title)) }}
      />
      <Breadcrumb items={crumbs} locale={locale} />
      <header className="mt-3">
        <h1 className="text-2xl font-semibold text-brand-dark">{list.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">{list.intro}</p>
      </header>
      <div className="mt-6">
        <ProductGrid items={list.items} locale={locale} listName={`best:${slug}`} sessionId={sessionId} />
      </div>
    </main>
  );
}
