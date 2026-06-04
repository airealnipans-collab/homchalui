"use client";
// apps/web/components/analytics/ProductAnalytics.tsx — fires view_item once. หอมฉลุย — Powered by 2T9COME.
import { useEffect, useRef } from "react";
import type { Locale } from "@homchalui/i18n";
import { viewItem } from "@homchalui/analytics";

export function ProductAnalytics(props: {
  locale: Locale;
  productId: string;
  productName: string;
  brand?: string;
  category?: string;
  price?: number | null;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    viewItem(props.locale, {
      productId: props.productId,
      productName: props.productName,
      brand: props.brand,
      category: props.category,
      price: props.price,
    });
  }, [props]);
  return null;
}
