// apps/web/app/(site)/compare/page.tsx — Thai compare (?ids=). หอมฉลุย — Powered by 2T9COME.
// Ad-hoc comparison is noindex (PAGE_SPECS §7); curated /compare/[slug] pages can be indexable later.
import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "เปรียบเทียบ | หอมฉลุย", robots: { index: false } };

type Props = { searchParams: { ids?: string } };

export default function ComparePage({ searchParams }: Props) {
  const ids = (searchParams.ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return <CompareView ids={ids} locale="th" />;
}
