// apps/web/app/[locale]/compare/page.tsx — localized compare (?ids=). หอมฉลุย — Powered by 2T9COME.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompareView } from "@/components/CompareView";
import { parsePrefixedLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

type Props = { params: { locale: string }; searchParams: { ids?: string } };

export default function LocaleComparePage({ params, searchParams }: Props) {
  const locale = parsePrefixedLocale(params.locale);
  if (!locale) notFound();
  const ids = (searchParams.ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return <CompareView ids={ids} locale={locale} />;
}
