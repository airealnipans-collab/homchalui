// apps/web/app/(site)/article/[slug]/page.tsx — Thai article. หอมฉลุย — Powered by 2T9COME.
import type { Metadata } from "next";
import { ArticleView } from "@/components/ArticleView";
import { articleMetadata } from "@/lib/articles";

const LOCALE = "th" as const;
type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return articleMetadata(params.slug, LOCALE, "article");
}

export default function ArticlePage({ params }: Props) {
  return <ArticleView slug={params.slug} locale={LOCALE} kind="article" />;
}
