# DESIGN_SYSTEM.md — หอมฉลุย UX/UI Direction

> Powered by 2T9COME

## 1. Mood
Clean · fragrant · soft · trustworthy · soft-premium (not overpriced-feeling) · friendly ·
shopping-like · easy to read · easy to compare.

## 2. Color tokens (official palette)
Defined as CSS variables in `apps/web/app/globals.css` and exposed via `tailwind.config.ts`.
This is the canonical palette — do not introduce ad-hoc hex values.

| Token (CSS var) | Tailwind | Hex | Use |
|-----------------|----------|-----|-----|
| `--bg-primary` | `bg-bg` | `#FFF8F1` | page background |
| `--bg-secondary` | `bg-bg-soft` | `#F7EFE6` | sections, strips, footer band |
| `--bg-card` | `bg-card` | `#FFFFFF` | product cards, panels |
| `--brand` | `brand` | `#B8895B` | price, primary CTA, active nav, "สั่งซื้อ" |
| `--brand-dark` | `brand-dark` | `#7A5436` | headings, section titles, pressed |
| `--accent-gold` | `gold` | `#D8B26E` | stars, badges, secondary buttons |
| `--text-main` | `text-main` | `#2F2923` | body text |
| `--text-secondary` | `text-secondary` | `#6F6258` | labels, secondary |
| `--text-muted` | `text-muted` | `#9A8D82` | hints, placeholders, struck price |
| `--soft-pink` | `pink` | `#EFC7C2` | category/scent tint, highlight |
| `--lavender` | `lavender` | `#DCD4F2` | category/scent tint, AEO box |
| `--sage` | `sage` | `#B8C7A8` | category/scent tint |
| `--border` | `line` | `#E8DCCD` | borders, dividers |
| `--success` | `success` | `#6F8F72` | "คุ้มสุด", tested, cheapest |
| `--warning` | `warning` | `#D89C45` | sponsored label, attention |
| `--error` | `error` | `#C7665A` | discount tag (-15%), broken link |

Text-on-tint pairs (keep AA contrast): pink → `#8a3f39`, lavender → `#3f3568`,
sage → `#3f4f33`, gold badge → `#4a3618`. Legacy aliases (`--bg-cream`, `--accent-pink`,
`--accent-lavender`, `--text-brown`, `--text-charcoal`) still resolve to the new values.

### Brand logo system
Assets live in `apps/web/public/brand/` (plus `apps/web/app/icon.svg` for the favicon).
Logo palette: gold `#D4AF37`, mid-brown `#8B5E34`, deep-brown `#3B2A1E`, pink `#F2C6D4`,
lavender `#D8C6E8`, sage `#B7C8A6`, cream `#FFF7EE`. The mark = a gold pot (with a smile) +
a swirl of "scent" with pastel petals + sparkles.

| File | Use |
|------|-----|
| `logo-horizontal.svg` | **Desktop header**, wide placements |
| `logo-stacked.svg` | splash / onboarding / share cards |
| `logo-icon.svg` | icon-only (light bg) |
| `logo-icon-dark.svg` | icon-only on dark backgrounds |
| `favicon.svg` → `app/icon.svg` | browser favicon |
| `app-icon-512.svg` | app/touch icon → **export to `app-icon-512.png`** |
| `og-logo-banner.svg` | social share → **export to `og-logo-banner.png`** |

Responsive usage (via `Logo` / `LogoCompact` components, see `SiteHeader.tsx`):
- **Desktop header** → `logo-horizontal.svg` (`Logo variant="horizontal"`).
- **Mobile header** → icon + short wordmark "หอมฉลุย" (`LogoCompact`).
- **Favicon / app icon** → icon-only.
- **Footer** → icon + "หอมฉลุย" wordmark, above `Powered by 2T9COME`.

### Production logo kit (LIVE — what's actually wired in)
The official rendered brand artwork ships in **`apps/web/public/brand/production_logo/`** and
is what the app uses everywhere visible. The hand-built SVGs above remain as the editable
vector source.

| Production file | Wired into |
|-----------------|-----------|
| `logo-horizontal.png` | desktop header (`Logo variant="horizontal"`) |
| `logo-icon.png` | mobile header (`LogoCompact`) + footer |
| `logo-icon-dark.png` | dark backgrounds |
| `logo-stacked.png` | splash / onboarding |
| `favicon.ico`, `favicon-16/32/48/64.png` | browser favicon (`metadata.icons`) |
| `apple-touch-icon.png` | iOS home-screen (`metadata.icons.apple`) |
| `android-chrome-192.png`, `app-icon-512.png`, `app-icon-1024.png` | PWA (`app/manifest.ts`) |
| `og-logo-banner.png` | Open Graph + Twitter card (`metadata.openGraph`) |
| `brand-identity-board.png` | reference board (not shipped to users) |

Favicon note: `apps/web/app/icon.svg` (vector) may still be served by modern browsers as the
SVG favicon. To make the production `favicon.ico` authoritative, drop it into
`apps/web/app/favicon.ico` and remove `app/icon.svg` (one Explorer step).

## 3. Typography
Readable Thai + Latin + CJK stack (e.g., Noto Sans Thai / Inter / Noto Sans SC). Generous line
height for reviews; clear hierarchy for scores and prices.

## 4. UI principles
Mobile-first · e-commerce-like product cards · easy filters · clear CTAs · uncluttered ·
readable SEO content · credible reviews · easy-to-understand badges · easy-to-read product
scores. No layout shift from badges/images.

## 5. Core components (`packages/ui`)
`ProductCard` · `ProductGrid` · `ProductCarousel` · `MerchantButton` (tracked outbound) ·
`ScentProfile` (note pyramid) · `ReviewSummary` · `RatingBreakdown` (per-axis bars) ·
`CategoryFilter` · `Breadcrumb` · `FAQBlock` · `LanguageSwitcher` · `Badge` (trending / best
seller / best value / luxury / long-lasting) · `LayoutSectionRenderer` · `Footer` (always
renders `Powered by 2T9COME`) · `AffiliateDisclosure` · `ProductActionBar` (sticky:
รีวิว / เทียบ / สั่งซื้อ).

### Buttons & CTA labels
- Per-merchant buy button (`MerchantButton`): merchant name on the left, price, and a filled
  pill labelled **"สั่งซื้อ"**. The cheapest merchant gets a `--success` highlight + "ถูกสุด".
  Primary merchant pill = filled `--brand`; others = `--bg-secondary` with `--gold` border.
- Product sticky bottom bar (`ProductActionBar`): **รีวิว** (scrolls to reviews) · **เทียบ**
  (add to compare) · big filled `--brand` button **"สั่งซื้อ"** (opens/scrolls to ช่องทางซื้อ).
- All buy CTAs route through the tracked `/go/:linkId` flow — never the raw affiliate URL.

## 6. Badge semantics
| Badge (th) | Meaning | Source |
|------------|---------|--------|
| มาแรง | trending | `trending_score` |
| ขายดี | best seller (proxy) | `best_click_score` |
| คุ้มสุด | best value | `value_score` |
| กลิ่นแพง | luxury scent | `luxury_score` |
| ติดทน | long-lasting | `longevity_score` |
Badges are derived from data/thresholds or `campaign_tag`, never arbitrary.

## 7. Score display
Overall + per-axis (scent, longevity, projection/sillage, value) as compact bars with numeric
value; consistent 0–10 (or 0–5) scale shown with the same scale everywhere.

---

Powered by 2T9COME
