// apps/web/app/(site)/best/[slug]/page.tsx — Thai "best of" list. หอมฉลุย — Powered by 2T9COME.
import type { Metadata } from "next";
import { BestView } from "@/components/BestView";
import { bestMetadata } from "@/lib/best";

const LOCALE = "th" as const;
type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return bestMetadata(params.slug, LOCALE);
}

export default function BestPage({ params }: Props) {
  return <BestView slug={params.slug} locale={LOCALE} />;
}
