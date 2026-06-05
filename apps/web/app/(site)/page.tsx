// apps/web/app/(site)/page.tsx — Thai home (default, no prefix). หอมฉลุย — Powered by 2T9COME.
// Driven by the Layout Builder (LayoutSectionRenderer) with a default fallback. See HomeView.
import { HomeView } from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeView locale="th" />;
}
