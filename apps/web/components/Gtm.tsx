// apps/web/components/Gtm.tsx — Google Tag Manager + dataLayer bootstrap.
// หอมฉลุย — Powered by 2T9COME. No-op if NEXT_PUBLIC_GTM_ID is unset. Snippet from @homchalui/analytics.
import Script from "next/script";
import { clientEnv } from "@homchalui/config/env";
import { gtmSnippet, gtmNoscriptSrc } from "@homchalui/analytics";

export function GtmScript() {
  const id = clientEnv.NEXT_PUBLIC_GTM_ID;
  if (!id) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {gtmSnippet(id)}
    </Script>
  );
}

export function GtmNoScript() {
  const id = clientEnv.NEXT_PUBLIC_GTM_ID;
  if (!id) return null;
  return (
    <noscript>
      <iframe src={gtmNoscriptSrc(id)} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
    </noscript>
  );
}
