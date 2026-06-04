// apps/web/app/(site)/layout.tsx — Thai (default, no prefix) group shell.
// Renders the responsive SiteHeader and the Footer so the brand logo + "Powered by 2T9COME"
// appear on every Thai page automatically. หอมฉลุย — Powered by 2T9COME.
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewTracker locale="th" />
      <SiteHeader />
      {children}
      <Footer locale="th" />
    </>
  );
}
