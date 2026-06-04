// apps/web/app/(site)/product/[slug]/page.tsx — Thai (default, no prefix) product detail.
// หอมฉลุย — Powered by 2T9COME. Thin wrapper over the shared, locale-parameterized ProductDetail
// view (apps/web/components/ProductDetail.tsx); /[locale]/product/[slug] mirrors it for en/zh.
import type { Metadata } from "next";
import { ProductDetail, productMetadata } from "@/components/ProductDetail";

const LOCALE = "th" as const;
type Params = { params: { slug: string } };

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return productMetadata(params.slug, LOCALE);
}

export default function ProductPage({ params }: Params) {
  return <ProductDetail slug={params.slug} locale={LOCALE} />;
}
