// apps/web/lib/articles.ts
// Article / guide resolvers — published-translation-only, cached. หอมฉลุย — Powered by 2T9COME.
// NO Thai fallback: a missing/unpublished translation in `locale` → null → notFound().
import type { Metadata } from "next";
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";
import { localizedPath, type Locale } from "@homchalui/i18n";
import type { Alternates } from "./seo/hreflang";
import { buildMetadata, notFoundMetadata } from "./seo/metadata";

export type ArticleKind = "article" | "guide";

export interface ArticleView {
  id: string;
  kind: ArticleKind;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  aeoSummary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faqItems: unknown;
}

export function articleBasePath(kind: ArticleKind, locale: Locale, slug: string): string {
  return localizedPath(locale, `/${kind}/${slug}`);
}

export function getArticleBySlug(slug: string, locale: Locale, kind: ArticleKind): Promise<ArticleView | null> {
  return withCache(
    `cache:article:${kind}:${locale}:${slug}`,
    300,
    async () => {
      const tr = await db.articleTranslation.findFirst({
        where: { locale, slug, status: "published", article: { status: "published", kind } },
        select: {
          title: true, slug: true, excerpt: true, content: true,
          seoTitle: true, seoDescription: true, aeoSummary: true, faqItems: true,
          article: { select: { id: true, kind: true, coverImageUrl: true } },
        },
      });
      if (!tr) return null;
      return {
        id: tr.article.id,
        kind: tr.article.kind as ArticleKind,
        title: tr.title,
        slug: tr.slug,
        excerpt: tr.excerpt,
        content: tr.content,
        coverImageUrl: tr.article.coverImageUrl,
        aeoSummary: tr.aeoSummary,
        seoTitle: tr.seoTitle,
        seoDescription: tr.seoDescription,
        faqItems: tr.faqItems,
      } satisfies ArticleView;
    },
    [`article:${kind}:${locale}:${slug}`],
  );
}

export async function articleAlternates(articleId: string, kind: ArticleKind): Promise<Alternates> {
  const trs = await db.articleTranslation.findMany({ where: { articleId, status: "published" }, select: { locale: true, slug: true } });
  const out: Alternates = {};
  for (const t of trs) out[t.locale] = articleBasePath(kind, t.locale, t.slug);
  return out;
}

export async function articleMetadata(slug: string, locale: Locale, kind: ArticleKind): Promise<Metadata> {
  const a = await getArticleBySlug(slug, locale, kind);
  if (!a) return notFoundMetadata(kind === "guide" ? "ไม่พบบทความแนะนำ | หอมฉลุย" : "ไม่พบบทความ | หอมฉลุย");
  return buildMetadata({
    locale,
    title: a.seoTitle ?? `${a.title} | หอมฉลุย`,
    description: a.seoDescription ?? a.excerpt,
    canonicalPath: articleBasePath(kind, locale, a.slug),
    alternates: await articleAlternates(a.id, kind),
    image: a.coverImageUrl,
    ogType: "article",
  });
}
