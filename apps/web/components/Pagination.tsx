// apps/web/components/Pagination.tsx — prev/next pager. หอมฉลุย — Powered by 2T9COME.
// Server component; plain links keep list pages crawlable and SSR-friendly.
import type { Locale } from "@homchalui/i18n";

const L: Record<Locale, { prev: string; next: string; page: string }> = {
  th: { prev: "ก่อนหน้า", next: "ถัดไป", page: "หน้า" },
  en: { prev: "Previous", next: "Next", page: "Page" },
  zh: { prev: "上一页", next: "下一页", page: "第" },
};

export function Pagination({
  page,
  hasMore,
  hrefForPage,
  locale,
}: {
  page: number;
  hasMore: boolean;
  hrefForPage: (page: number) => string;
  locale: Locale;
}) {
  if (page <= 1 && !hasMore) return null;
  const t = L[locale];
  const btn = "rounded-full border border-line px-4 py-2 text-sm";
  const off = "opacity-40";

  return (
    <nav className="mt-8 flex items-center justify-center gap-4" aria-label="pagination">
      {page > 1 ? (
        <a href={hrefForPage(page - 1)} className={`${btn} text-text-secondary hover:border-brand`} rel="prev">
          ← {t.prev}
        </a>
      ) : (
        <span className={`${btn} ${off}`}>← {t.prev}</span>
      )}
      <span className="text-sm text-text-muted">{t.page} {page}</span>
      {hasMore ? (
        <a href={hrefForPage(page + 1)} className={`${btn} text-text-secondary hover:border-brand`} rel="next">
          {t.next} →
        </a>
      ) : (
        <span className={`${btn} ${off}`}>{t.next} →</span>
      )}
    </nav>
  );
}
