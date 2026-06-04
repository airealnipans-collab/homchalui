// packages/analytics/src/gtm.ts — GTM container snippet + dataLayer name. หอมฉลุย — Powered by 2T9COME.
// Single source for the GTM bootstrap so the web Gtm component doesn't hand-roll the snippet.
export const DATA_LAYER_NAME = "dataLayer";

/** GTM container loader snippet (inline <script> body). `id` = NEXT_PUBLIC_GTM_ID. */
export function gtmSnippet(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${DATA_LAYER_NAME}','${id}');`;
}

/** <noscript> iframe src for GTM. */
export function gtmNoscriptSrc(id: string): string {
  return `https://www.googletagmanager.com/ns.html?id=${id}`;
}
