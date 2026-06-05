// apps/web/app/[locale]/article/[slug]/page.tsx — localized article. หอมฉลุย — Powered by 2T9COME.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { articleMetadata } from "@/lib/articles";
import { parsePrefixedLocale } from "@/lib/locale";

type Props = { params: { locale: string; slug: string } };

export function generateMetadata({ params }: Props): Promise<Metadata> | Metadata {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return articleMetadata(params.slug, locale, "article");
}

export default function LocaleArticlePage({ params }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  return <ArticleView slug={params.slug} locale={locale} kind="article" />;
}
