// apps/web/app/[locale]/best/[slug]/page.tsx — localized "best of" list. หอมฉลุย — Powered by 2T9COME.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BestView } from "@/components/BestView";
import { bestMetadata } from "@/lib/best";
import { parsePrefixedLocale } from "@/lib/locale";

type Props = { params: { locale: string; slug: string } };

export function generateMetadata({ params }: Props): Promise<Metadata> | Metadata {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return bestMetadata(params.slug, locale);
}

export default function LocaleBestPage({ params }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  return <BestView slug={params.slug} locale={locale} />;
}
