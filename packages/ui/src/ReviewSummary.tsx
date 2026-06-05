// packages/ui/src/ReviewSummary.tsx — review card. หอมฉลุย — Powered by 2T9COME.
// Renders a single review with a quick verdict + pros/cons + best/not-for. Integrity rule
// (CLAUDE.md §2.6): the **Tested** and **Sponsored** badges render straight from the data flags.
import type { Locale } from "@homchalui/i18n";
import { cn } from "./cn";

const L = {
  tested: { th: "ทดลองใช้จริง", en: "Tested", zh: "实测" },
  sponsored: { th: "ได้รับการสนับสนุน", en: "Sponsored", zh: "赞助" },
  pros: { th: "ข้อดี", en: "Pros", zh: "优点" },
  cons: { th: "ข้อสังเกต", en: "Cons", zh: "缺点" },
  bestFor: { th: "เหมาะกับ", en: "Best for", zh: "适合" },
  notFor: { th: "ไม่เหมาะกับ", en: "Not for", zh: "不适合" },
  reviews: { th: "รีวิว", en: "reviews", zh: "评测" },
} satisfies Record<string, Record<Locale, string>>;

export interface ReviewSummaryProps {
  title?: string;
  summary: string;
  reviewer?: string | null;
  rating?: number | null;
  pros?: string[];
  cons?: string[];
  bestFor?: string | null;
  notFor?: string | null;
  tested?: boolean;
  sponsored?: boolean;
  locale: Locale;
  className?: string;
}

export function ReviewSummary({
  title, summary, reviewer, rating, pros = [], cons = [], bestFor, notFor, tested, sponsored, locale, className,
}: ReviewSummaryProps) {
  return (
    <article className={cn("rounded-2xl border border-line bg-card p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {title && <h3 className="font-medium text-text-main">{title}</h3>}
        {rating != null && (
          <span className="text-sm text-text-secondary">
            <span aria-hidden="true">★</span> {rating}
          </span>
        )}
        {tested && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">{L.tested[locale]}</span>
        )}
        {sponsored && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">{L.sponsored[locale]}</span>
        )}
      </div>

      {reviewer && <p className="mt-0.5 text-xs text-text-muted">{reviewer}</p>}
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{summary}</p>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {pros.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-success">{L.pros[locale]}</p>
              <ul className="list-disc pl-4 text-sm text-text-secondary">{pros.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-warning">{L.cons[locale]}</p>
              <ul className="list-disc pl-4 text-sm text-text-secondary">{cons.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {(bestFor || notFor) && (
        <dl className="mt-3 space-y-1 text-sm">
          {bestFor && <div className="flex gap-2"><dt className="text-text-muted">{L.bestFor[locale]}:</dt><dd className="text-text-secondary">{bestFor}</dd></div>}
          {notFor && <div className="flex gap-2"><dt className="text-text-muted">{L.notFor[locale]}:</dt><dd className="text-text-secondary">{notFor}</dd></div>}
        </dl>
      )}
    </article>
  );
}
