"use client";
// packages/ui/src/Gallery.tsx — product image gallery. หอมฉลุย — Powered by 2T9COME.
// Main image + thumbnail strip (click to switch). Degrades to a single image gracefully.
import { useState } from "react";
import type { Locale } from "@homchalui/i18n";
import { cn } from "./cn";

export interface GalleryImage {
  url: string;
  alt?: string;
}

export function Gallery({ images, alt, locale }: { images: GalleryImage[]; alt: string; locale?: Locale }) {
  const [active, setActive] = useState(0);
  void locale;
  if (images.length === 0) {
    return <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-bg-soft text-text-muted"><span className="ti ti-flask-2 text-4xl" aria-hidden="true" /></div>;
  }
  const current = images[Math.min(active, images.length - 1)]!;
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.url} alt={current.alt ?? alt} className="aspect-square w-full rounded-2xl object-cover" />
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`image ${i + 1}`}
              className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-lg border", i === active ? "border-brand" : "border-line")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? `${alt} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
