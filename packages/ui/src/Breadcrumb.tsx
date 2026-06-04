// packages/ui/src/Breadcrumb.tsx — breadcrumb trail. หอมฉลุย — Powered by 2T9COME.
// Markup only; the page owns the BreadcrumbList JSON-LD (avoid duplication, COMPONENT_LIBRARY).
import type { Locale } from "@homchalui/i18n";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, locale }: { items: Crumb[]; locale: Locale }) {
  return (
    <nav aria-label="breadcrumb" className="text-sm text-text-muted" data-locale={locale}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <a href={c.href} className="hover:text-brand">
                  {c.label}
                </a>
              ) : (
                <span className={last ? "text-text-secondary" : undefined} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
