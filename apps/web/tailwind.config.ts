// apps/web/tailwind.config.ts — หอมฉลุย design tokens. Powered by 2T9COME.
// Token values mirror docs/DESIGN_SYSTEM.md. Colors are exposed as CSS vars in globals.css
// and referenced via var(--token) so the backoffice theme can override at runtime.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg-primary)",
        "bg-soft": "var(--bg-secondary)",
        card: "var(--bg-card)",
        brand: "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        gold: "var(--accent-gold)",
        pink: "var(--soft-pink)",
        lavender: "var(--lavender)",
        sage: "var(--sage)",
        line: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        "text-main": "var(--text-main)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        cream: "var(--bg-primary)",
        brown: "var(--brand-dark)",
        charcoal: "var(--text-main)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
