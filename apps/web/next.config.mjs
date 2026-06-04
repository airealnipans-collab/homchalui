// apps/web/next.config.mjs — หอมฉลุย. Powered by 2T9COME.
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages (shipped as TS).
  transpilePackages: [
    "@homchalui/config",
    "@homchalui/db",
    "@homchalui/i18n",
    "@homchalui/redis",
    "@homchalui/ui",
    "@homchalui/validators",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.homchalui.com" },
      // add R2 public host here
    ],
  },
  experimental: {
    // serverActions are stable in 14; keep options here as the app grows.
  },
};

export default nextConfig;
