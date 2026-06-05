// apps/web/app/(site)/guide/[slug]/page.tsx — Thai buying guide. หอมฉลุย — Powered by 2T9COME.
import type { Metadata } from "next";
import { ArticleView } from "@/components/ArticleView";
import { articleMetadata } from "@/lib/articles";

const LOCALE = "th" as const;
type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return articleMetadata(params.slug, LOCALE, "guide");
}

export default function GuidePage({ params }: Props) {
  return <ArticleView slug={params.slug} locale={LOCALE} kind="guide" />;
}
