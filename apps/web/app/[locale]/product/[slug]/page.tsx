// apps/web/app/[locale]/product/[slug]/page.tsx — localized product detail (/en, /zh).
// หอมฉลุย — Powered by 2T9COME. Mirrors the Thai product page via the shared ProductDetail view.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail, productMetadata } from "@/components/ProductDetail";
import { parsePrefixedLocale } from "@/lib/locale";

type Params = { params: { locale: string; slug: string } };

export function generateMetadata({ params }: Params): Promise<Metadata> | Metadata {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) return { robots: { index: false } };
  return productMetadata(params.slug, locale);
}

export default function LocaleProductPage({ params }: Params) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  return <ProductDetail slug={params.slug} locale={locale} />;
}
