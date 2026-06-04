// apps/web/app/layout.tsx — root layout. หอมฉลุย — Powered by 2T9COME.
// Sets <html lang> from the resolved locale (middleware sets x-locale header), loads GTM,
// and initializes window.dataLayer. The Footer (with the permanent credit) is rendered by the
// per-locale group layouts so it appears on EVERY page.
import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { GtmScript, GtmNoScript } from "@/components/Gtm";
import { LOCALE_HTML_LANG, isLocale, DEFAULT_LOCALE } from "@homchalui/i18n";

export const metadata: Metadata = {
  title: { default: "หอมฉลุย — รีวิวของหอม", template: "%s | หอมฉลุย" },
  description: "รีวิว เปรียบเทียบ และเลือกซื้อของหอม น้ำหอม เทียนหอม และอื่น ๆ",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  // Production raster favicon/app/OG kit (real brand artwork).
  // NOTE: apps/web/app/icon.svg (vector) may still serve as the SVG favicon in modern browsers.
  // To make the production favicon authoritative, drop favicon.ico into apps/web/app/ and
  // remove app/icon.svg (one Explorer step — can't be scripted here without a shell).
  icons: {
    icon: [
      { url: "/brand/production_logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/production_logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/brand/production_logo/favicon.ico",
    apple: "/brand/production_logo/apple-touch-icon.png",
  },
  openGraph: {
    title: "หอมฉลุย — รีวิวของหอม",
    description: "รีวิวหอม จริงใจ • เลือกซื้อได้อย่างมั่นใจ",
    images: [{ url: "/brand/production_logo/og-logo-banner.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/production_logo/og-logo-banner.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerLocale = headers().get("x-locale") ?? DEFAULT_LOCALE;
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  return (
    <html lang={LOCALE_HTML_LANG[locale]}>
      <head>
        {/* Tabler icon webfont — powers the `ti ti-*` classes used in headers/components. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <GtmScript />
        <GtmNoScript />
        {children}
      </body>
    </html>
  );
}
