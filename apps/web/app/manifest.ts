// apps/web/app/manifest.ts — PWA manifest. หอมฉลุย — Powered by 2T9COME.
// Uses the production raster icon kit. Served at /manifest.webmanifest by Next.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "หอมฉลุย — รีวิวของหอม",
    short_name: "หอมฉลุย",
    description: "รีวิว เปรียบเทียบ และเลือกของหอมที่ใช่ แล้วกดสั่งซื้อผ่านร้านที่ต้องการ",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F1",
    theme_color: "#B8895B",
    icons: [
      { src: "/brand/production_logo/android-chrome-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/production_logo/app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/production_logo/app-icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
  };
}
