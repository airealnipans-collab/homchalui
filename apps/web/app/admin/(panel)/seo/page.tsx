// apps/web/app/admin/(panel)/seo/page.tsx — SEO/AEO Manager. หอมฉลุย — Powered by 2T9COME.
// Per-locale health score + issue list with inline fixes. RBAC enforced by the API + middleware.
import Link from "next/link";
import { isLocale, type Locale } from "@homchalui/i18n";
import { getSeoHealth } from "@/lib/admin-seo";
import { SeoIssueRow } from "@/components/admin/SeoIssueRow";

export const dynamic = "force-dynamic";

type Props = { searchParams: { locale?: string } };

export default async function AdminSeoPage({ searchParams }: Props) {
  const locale: Locale = isLocale(searchParams.locale ?? "") ? (searchParams.locale as Locale) : "th";
  const health = await getSeoHealth(locale);
  const scoreColor = health.score >= 80 ? "text-success" : health.score >= 50 ? "text-warning" : "text-error";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-dark">SEO / AEO Manager</h1>
        <div className="flex items-center gap-3 text-sm">
          {(["th", "en", "zh"] as const).map((l) => (
            <Link key={l} href={`/admin/seo?locale=${l}`} className={l === locale ? "font-semibold text-brand" : "text-text-secondary hover:text-brand"}>{l}</Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-2xl border border-line bg-card p-4">
        <div>
          <p className="text-xs text-text-muted">SEO health ({locale})</p>
          <p className={`text-3xl font-semibold ${scoreColor}`}>{health.score}%</p>
        </div>
        <p className="text-sm text-text-secondary">
          {health.complete}/{health.total} รายการมี SEO ครบ · {health.issues.length} รายการต้องแก้
        </p>
      </div>

      {health.issues.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-sm text-success">ทุกรายการมี SEO ครบแล้ว 🎉</p>
      ) : (
        <div className="space-y-3">
          {health.issues.map((i) => (
            <SeoIssueRow key={`${i.entityType}:${i.id}`} issue={i} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
