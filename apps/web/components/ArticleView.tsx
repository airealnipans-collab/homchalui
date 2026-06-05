// apps/web/components/ArticleView.tsx
// Shared article/guide view + metadata wiring. หอมฉลุย — Powered by 2T9COME.
// Used by /guide/[slug] + /article/[slug] (th) and their /[locale] mirrors. Published-only, no
// Thai fallback. Emits Article + FAQPage + BreadcrumbList JSON-LD. Content is rendered as text
// (no dangerouslySetInnerHTML — avoids stored-XSS from editor content).
import { notFound } from "next/navigation";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { Breadcrumb, FAQBlock, type Crumb, type FaqItem } from "@homchalui/ui";
import { getArticleBySlug, articleBasePath, type ArticleKind } from "@/lib/articles";
import { articleLd, breadcrumbLd, faqLd, ld } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/hreflang";
import { HOME_LABEL } from "@/lib/list-page";

const SECTION_LABEL: Record<ArticleKind, Record<Locale, string>> = {
  guide: { th: "คู่มือ", en: "Guides", zh: "指南" },
  article: { th: "บทความ", en: "Articles", zh: "文章" },
};

function parseFaq(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  const out: FaqItem[] = [];
  for (const it of raw) {
    if (it && typeof it === "object" && "q" in it && "a" in it) {
      const q = (it as { q: unknown }).q;
      const a = (it as { a: unknown }).a;
      if (typeof q === "string" && typeof a === "string") out.push({ q, a });
    }
  }
  return out;
}

export async function ArticleView({ slug, locale, kind }: { slug: string; locale: Locale; kind: ArticleKind }) {
  const a = await getArticleBySlug(slug, locale, kind);
  if (!a) notFound();

  const faq = parseFaq(a.faqItems);
  const crumbs: Crumb[] = [
    { label: HOME_LABEL[locale], href: localizedPath(locale, "/") },
    { label: SECTION_LABEL[kind][locale] },
    { label: a.title },
  ];
  const url = absoluteUrl(articleBasePath(kind, locale, a.slug));
  const graph: unknown[] = [
    articleLd({ title: a.title, description: a.excerpt, url, image: a.coverImageUrl, locale }),
    breadcrumbLd(crumbs),
  ];
  if (faq.length) graph.push(faqLd(faq));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(...graph) }} />
      <Breadcrumb items={crumbs} locale={locale} />

      <article className="mt-4">
        <h1 className="text-3xl font-semibold text-brand-dark">{a.title}</h1>
        {a.excerpt && <p className="mt-2 text-text-secondary">{a.excerpt}</p>}
        {a.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.coverImageUrl} alt={a.title} className="mt-4 w-full rounded-2xl" />
        )}
        {a.aeoSummary && (
          <p className="mt-4 rounded-xl bg-lavender/30 p-3 text-sm">{a.aeoSummary}</p>
        )}
        <div className="prose mt-6 whitespace-pre-line text-sm leading-relaxed text-text-main">{a.content}</div>
      </article>

      <FAQBlock items={faq} locale={locale} />
    </main>
  );
}
