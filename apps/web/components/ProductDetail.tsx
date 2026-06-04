// apps/web/components/ProductDetail.tsx
// Shared product-detail view + metadata, locale-parameterized. หอมฉลุย — Powered by 2T9COME.
// Used by /product/[slug] (th) and /[locale]/product/[slug] (en/zh). Published-only, no Thai
// fallback (missing translation → notFound). SEO via lib/seo/* (Product/AggregateOffer/
// AggregateRating/FAQ/Breadcrumb JSON-LD + canonical + hreflang).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedPath, type Locale } from "@homchalui/i18n";
import { Breadcrumb, FAQBlock, type FaqItem } from "@homchalui/ui";
import { getProductBySlug, type ProductDetail as ProductDetailVM } from "@/lib/products";
import { getSessionId } from "@/lib/session";
import { productAlternates } from "@/lib/locale";
import { productLd, breadcrumbLd, faqLd, ld, type Crumb } from "@/lib/seo/jsonld";
import { buildMetadata, notFoundMetadata } from "@/lib/seo/metadata";
import { MerchantButton } from "@/components/MerchantButton";
import { ProductActionBar } from "@/components/ProductActionBar";

const NOT_FOUND_TITLE: Record<Locale, string> = {
  th: "ไม่พบสินค้า | หอมฉลุย",
  en: "Product not found | Homchalui",
  zh: "未找到商品 | Homchalui",
};
const HOME_LABEL: Record<Locale, string> = { th: "หน้าแรก", en: "Home", zh: "首页" };
const PROS: Record<Locale, string> = { th: "ข้อดี", en: "Pros", zh: "优点" };
const CONS: Record<Locale, string> = { th: "ข้อที่ต้องคิดก่อนซื้อ", en: "Cons", zh: "缺点" };
const REVIEW_SUMMARY: Record<Locale, string> = { th: "สรุปรีวิว", en: "Review summary", zh: "评测摘要" };
const REVIEWS_WORD: Record<Locale, string> = { th: "รีวิว", en: "reviews", zh: "条评测" };

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

export async function productMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const p = await getProductBySlug(slug, locale);
  if (!p) return notFoundMetadata(NOT_FOUND_TITLE[locale]);
  const t = p.translation;
  return buildMetadata({
    locale,
    title: t.seoTitle ?? `${t.name} | หอมฉลุย`,
    description: t.seoDescription ?? t.shortDescription,
    canonicalPath: localizedPath(locale, `/product/${t.slug}`),
    alternates: await productAlternates(p.id),
    canonicalOverride: t.canonicalUrl,
    image: t.ogImageUrl ?? p.mainImageUrl,
  });
}

function buildJsonLd(p: ProductDetailVM, locale: Locale, crumbs: Crumb[]) {
  const t = p.translation;
  const graph: unknown[] = [
    productLd({
      name: t.name,
      brandName: p.brand.name,
      image: p.mainImageUrl,
      description: t.shortDescription,
      locale,
      currency: p.currency,
      priceMin: p.priceMin,
      priceMax: p.priceMax,
      offerCount: p.merchantLinks.length,
      rating: p.rating,
    }),
    breadcrumbLd(crumbs),
  ];
  const faq = parseFaq(t.faqItems);
  if (faq.length) graph.push(faqLd(faq));
  return graph;
}

export async function ProductDetail({ slug, locale }: { slug: string; locale: Locale }) {
  const p = await getProductBySlug(slug, locale);
  if (!p) notFound(); // no fallback — unpublished/missing translation ⇒ 404

  const t = p.translation;
  const sessionId = getSessionId();
  const sourcePage = localizedPath(locale, `/product/${t.slug}`);
  const faq = parseFaq(t.faqItems);
  const prices = p.merchantLinks.map((l) => l.price).filter((x): x is number => x != null);
  const cheapestPrice = prices.length ? Math.min(...prices) : null;
  const crumbs: Crumb[] = [
    { label: HOME_LABEL[locale], href: localizedPath(locale, "/") },
    { label: p.brand.name, href: localizedPath(locale, `/brand/${p.brand.slug}`) },
    { label: t.name },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(...buildJsonLd(p, locale, crumbs)) }} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Breadcrumb items={crumbs} locale={locale} />

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div>
            {p.mainImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.mainImageUrl} alt={t.name} className="w-full rounded-2xl" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-brand-dark">{t.name}</h1>
            <p className="mt-1 text-text-muted">{p.brand.name}</p>

            {p.rating && (
              <p className="mt-2 text-sm">
                ⭐ {p.rating.value} <span className="text-text-muted">({p.rating.count} {REVIEWS_WORD[locale]})</span>
              </p>
            )}

            {p.priceMin != null && (
              <p className="mt-3 text-xl font-medium text-text-main">
                ฿{p.priceMin.toLocaleString()}
                {p.priceMax != null && p.priceMax !== p.priceMin ? ` – ฿${p.priceMax.toLocaleString()}` : ""}
              </p>
            )}

            {t.aeoSummary && <p className="mt-4 rounded-xl bg-lavender/30 p-3 text-sm">{t.aeoSummary}</p>}

            <div id="merchants" className="mt-6 space-y-2">
              {p.merchantLinks.map((l) => (
                <MerchantButton
                  key={l.id}
                  linkId={l.id}
                  merchant={l.merchant}
                  productId={p.id}
                  productName={t.name}
                  locale={locale}
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
              <h2 className="mb-2 font-semibold">{PROS[locale]}</h2>
              <ul className="list-disc pl-5 text-sm">{t.pros.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">{CONS[locale]}</h2>
              <ul className="list-disc pl-5 text-sm">{t.cons.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          </section>
        )}

        {t.reviewSummary && (
          <section id="reviews" className="mt-10">
            <h2 className="mb-2 font-semibold">{REVIEW_SUMMARY[locale]}</h2>
            <p className="text-sm leading-relaxed">{t.reviewSummary}</p>
          </section>
        )}

        <FAQBlock items={faq} locale={locale} />
      </main>

      <ProductActionBar
        locale={locale}
        productId={p.id}
        reviewCount={p.rating?.count ?? 0}
        merchantCount={p.merchantLinks.length}
      />
    </>
  );
}
