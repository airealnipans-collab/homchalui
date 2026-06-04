// apps/web/app/(site)/product/[slug]/page.tsx
// Thai (default, NO prefix) product detail page. หอมฉลุย — Powered by 2T9COME.
// Server Component. Cached read (Redis) → published-translation-only (no Thai fallback issue
// here since this IS Thai). Emits SEO metadata + Product/Review/AggregateRating/FAQ JSON-LD.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getSessionId } from "@/lib/session";
import { MerchantButton } from "@/components/MerchantButton";
import { ProductActionBar } from "@/components/ProductActionBar";
import { clientEnv } from "@homchalui/config/env";
// Footer is rendered by app/(site)/layout.tsx (Powered by 2T9COME on every page).

const LOCALE = "th" as const;
const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProductBySlug(params.slug, LOCALE);
  if (!p) return { title: "ไม่พบสินค้า | หอมฉลุย", robots: { index: false } };
  const t = p.translation;
  const canonical = t.canonicalUrl ?? `${SITE}/product/${t.slug}`;
  return {
    title: t.seoTitle ?? `${t.name} | หอมฉลุย`,
    description: t.seoDescription ?? t.shortDescription ?? undefined,
    alternates: { canonical }, // hreflang added once en/zh translations are published
    openGraph: {
      title: t.seoTitle ?? t.name,
      description: t.seoDescription ?? undefined,
      url: canonical,
      images: t.ogImageUrl ? [t.ogImageUrl] : p.mainImageUrl ? [p.mainImageUrl] : [],
      locale: "th_TH",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

function jsonLd(p: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const t = p.translation;
  const graph: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t.name,
    brand: { "@type": "Brand", name: p.brand.name },
    image: p.mainImageUrl ?? undefined,
    description: t.shortDescription ?? undefined,
    inLanguage: "th",
  };
  if (p.priceMin != null) {
    graph.offers = {
      "@type": "AggregateOffer",
      priceCurrency: p.currency,
      lowPrice: p.priceMin,
      highPrice: p.priceMax ?? p.priceMin,
      offerCount: p.merchantLinks.length,
    };
  }
  if (p.rating) {
    graph.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.rating.value,
      reviewCount: p.rating.count,
    };
  }
  return graph;
}

export default async function ProductPage({ params }: Params) {
  const p = await getProductBySlug(params.slug, LOCALE);
  if (!p) notFound(); // no fallback — unpublished/missing => 404

  const t = p.translation;
  const sessionId = getSessionId(); // stable per-visitor id (cookie set in middleware)
  const sourcePage = `/product/${t.slug}`;
  const prices = p.merchantLinks.map((l) => l.price).filter((x): x is number => x != null);
  const cheapestPrice = prices.length ? Math.min(...prices) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(p)) }}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 text-sm text-black/60">หน้าแรก / {p.brand.name} / {t.name}</nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            {p.mainImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.mainImageUrl} alt={t.name} className="w-full rounded-2xl" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-brown)]">{t.name}</h1>
            <p className="mt-1 text-black/60">{p.brand.name}</p>

            {p.rating && (
              <p className="mt-2 text-sm">
                ⭐ {p.rating.value} <span className="text-black/50">({p.rating.count} รีวิว)</span>
              </p>
            )}

            {p.priceMin != null && (
              <p className="mt-3 text-xl font-medium">
                ฿{p.priceMin.toLocaleString()}
                {p.priceMax != null && p.priceMax !== p.priceMin ? ` – ฿${p.priceMax.toLocaleString()}` : ""}
              </p>
            )}

            {t.aeoSummary && <p className="mt-4 rounded-xl bg-[var(--accent-lavender)]/30 p-3 text-sm">{t.aeoSummary}</p>}

            {/* Tracked buy buttons — one per active merchant link */}
            <div id="merchants" className="mt-6 space-y-2">
              {p.merchantLinks.map((l) => (
                <MerchantButton
                  key={l.id}
                  linkId={l.id}
                  merchant={l.merchant}
                  productId={p.id}
                  productName={t.name}
                  locale={LOCALE}
                  price={l.price}
                  currency={p.currency}
                  sessionId={sessionId}
                  sourcePage={sourcePage}
                  cheapest={cheapestPrice != null && l.price === cheapestPrice}
                />
              ))}
            </div>
          </div>
        </div>

        {(t.pros.length > 0 || t.cons.length > 0) && (
          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-2 font-semibold">ข้อดี</h2>
              <ul className="list-disc pl-5 text-sm">{t.pros.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">ข้อที่ต้องคิดก่อนซื้อ</h2>
              <ul className="list-disc pl-5 text-sm">{t.cons.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          </section>
        )}

        {t.reviewSummary && (
          <section id="reviews" className="mt-10">
            <h2 className="mb-2 font-semibold">สรุปรีวิว</h2>
            <p className="text-sm leading-relaxed">{t.reviewSummary}</p>
          </section>
        )}
      </main>

      <ProductActionBar
        locale={LOCALE}
        productId={p.id}
        reviewCount={p.rating?.count ?? 0}
        merchantCount={p.merchantLinks.length}
      />
    </>
  );
}
