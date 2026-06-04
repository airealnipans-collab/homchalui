"use client";
// packages/ui/src/ProductCard.tsx — e-commerce-style product card. หอมฉลุย — Powered by 2T9COME.
// Presentational + select_item tracking. Links to the localized product page (NOT a raw
// affiliate URL — outbound only happens on the detail page via MerchantButton → /go/:id).
import type { Locale } from "@homchalui/i18n";
import { localizedPath } from "@homchalui/i18n";
import type { ProductCardVM } from "@homchalui/validators";
import { Badge } from "./Badge";
import { cn } from "./cn";
import { formatPrice } from "./format";
import { track } from "./track";

const L = {
  buy: { th: "ไปซื้อ", en: "Where to buy", zh: "去购买" },
  reviews: { th: "รีวิว", en: "reviews", zh: "条评测" },
} satisfies Record<string, Record<Locale, string>>;

interface Props {
  product: ProductCardVM;
  locale: Locale;
  listName?: string;
  position?: number;
  sessionId?: string;
  className?: string;
}

export function ProductCard({ product, locale, listName, position, sessionId, className }: Props) {
  const href = localizedPath(locale, `/product/${product.slug}`);

  function onSelect() {
    track("select_item", locale, {
      item_id: product.id,
      item_name: product.name,
      list_name: listName,
      position,
      price: product.priceMin ?? undefined,
      session_id: sessionId,
    });
  }

  return (
    <a
      href={href}
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-bg-soft">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <span className="ti ti-flask-2 text-3xl" aria-hidden="true" />
          </div>
        )}
        {product.badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.badges.slice(0, 2).map((b) => (
              <Badge key={b} kind={b} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-text-main">{product.name}</p>
        <p className="text-xs text-text-muted">{product.brand.name}</p>

        {product.rating && (
          <p className="text-xs text-text-secondary">
            <span aria-hidden="true">★</span> {product.rating.value}{" "}
            <span className="text-text-muted">({product.rating.count} {L.reviews[locale]})</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          {product.priceMin != null ? (
            <span className="text-sm font-semibold text-brand-dark">
              {formatPrice(product.priceMin, product.currency, locale)}
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">{L.buy[locale]}</span>
        </div>
      </div>
    </a>
  );
}

/** Skeleton placeholder while a grid loads. */
ProductCard.Skeleton = function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="aspect-square w-full animate-pulse bg-bg-soft" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-bg-soft" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-bg-soft" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-bg-soft" />
      </div>
    </div>
  );
};
