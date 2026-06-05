// apps/web/app/admin/(panel)/layout/page.tsx — Layout Builder admin. หอมฉลุย — Powered by 2T9COME.
// Page picker (key) × locale → edit sections. Mutations via /api/admin/layout (RBAC layout.update).
import Link from "next/link";
import { isLocale, type Locale } from "@homchalui/i18n";
import { getLayoutForEdit } from "@/lib/admin-layout";
import { LayoutBuilderEditor } from "@/components/admin/LayoutBuilderEditor";

export const dynamic = "force-dynamic";

type Props = { searchParams: { key?: string; locale?: string } };

export default async function AdminLayoutPage({ searchParams }: Props) {
  const key = searchParams.key || "home";
  const locale: Locale = isLocale(searchParams.locale ?? "") ? (searchParams.locale as Locale) : "th";
  const initial = await getLayoutForEdit(key, locale);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-text-muted">หน้า:</span>
        <span className="font-medium">{key}</span>
        <span className="ml-4 text-text-muted">ภาษา:</span>
        {(["th", "en", "zh"] as const).map((l) => (
          <Link
            key={l}
            href={`/admin/layout?key=${encodeURIComponent(key)}&locale=${l}`}
            className={l === locale ? "font-semibold text-brand" : "text-text-secondary hover:text-brand"}
          >
            {l}
          </Link>
        ))}
      </div>
      <LayoutBuilderEditor initial={initial} />
    </div>
  );
}
