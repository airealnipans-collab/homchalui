# FRONTEND.md — หอมฉลุย Front Website

> Powered by 2T9COME

Mobile-first, e-commerce-like UX, SEO-friendly server rendering. Footer `Powered by 2T9COME`
on every page. Components are composed from `packages/ui` (see `docs/DESIGN_SYSTEM.md`).

## 1. Page types & routes
| Page | Thai (default) | en | zh |
|------|----------------|----|----|
| Home | `/` | `/en` | `/zh` |
| Category | `/category/[slug]` | `/en/category/[slug]` | `/zh/category/[slug]` |
| Product | `/product/[slug]` | `/en/product/[slug]` | `/zh/product/[slug]` |
| Brand | `/brand/[slug]` | `/en/brand/[slug]` | `/zh/brand/[slug]` |
| Scent family | `/scent/[slug]` | `/en/scent/[slug]` | `/zh/scent/[slug]` |
| Best lists | `/best/[slug]` | `/en/best/[slug]` | `/zh/best/[slug]` |
| Compare | `/compare/[slug]` | `/en/compare/[slug]` | `/zh/compare/[slug]` |
| Guide | `/guide/[slug]` | `/en/guide/[slug]` | `/zh/guide/[slug]` |
| Article | `/article/[slug]` | `/en/article/[slug]` | `/zh/article/[slug]` |

## 2. Home
Sections (data-driven via Layout Builder; see `docs/BACKOFFICE.md`):
Hero banner · search bar · category grid · best sellers (best-click proxy) · trending ·
"most clicked-out" · editorial picks · perfume men / women / unisex · scented candle ·
incense · room spray · bedroom scent · bathroom scent · car fragrance · budget ≤500 / ≤1,000
/ ≤3,000 · clean / sweet / luxury / hotel scents · latest reviews · featured articles.
Each section is a `LayoutSectionRenderer` reading a JSON config (`source`, `limit`,
`category`, `sort`).

## 3. Category page
Product grid + filter rail + sort + SEO content block + FAQ + breadcrumb + pagination or
infinite scroll. Server-rendered listing; filters update via URL search params (shareable,
indexable where appropriate).

**Filters:** price, product type, gender/mood, longevity, projection/sillage, season,
occasion, brand, scent notes, scent family, merchant/where-to-buy, review rating, value.

**Sort:** recommended-for-you, trending, most-clicked, best-reviewed, price low→high,
price high→low, longest-lasting, beginner-friendly.

## 4. Product detail
Gallery · name · brand · type · approx price · overall score · per-axis scores (scent,
longevity, projection/sillage, value) · scent profile (top/middle/base notes, scent family) ·
mood · occasion · best-for / not-for · pros/cons · quick review summary · full review · FAQ ·
similar products · "people also viewed" · multi-merchant buy buttons (tracked) · JSON-LD
(Product + Review + AggregateRating + FAQPage + BreadcrumbList) · SEO metadata · AEO summary.

## 5. Product card
Image · badges (trending / best seller / best value / luxury / long-lasting) · name · brand ·
starting price · review score · longevity · mood/occasion fit · outbound-click count ·
"ดูรีวิว" (View review) + "ไปซื้อ" (Buy) buttons. Buy button uses the tracked outbound flow.

## 6. Buy buttons & merchants
`MerchantButton` renders per `product_merchant_links` (Shopee, Lazada, Central, Amazon,
TikTok Shop, official, custom). Merchants are **data-driven**, ordered by `priority`. The
button targets `/go/:linkId`; it never exposes the raw affiliate URL and never bypasses
tracking. Show an affiliate disclosure near the buttons (localized).

## 7. Performance
- RSC + streaming; `next/image` with R2/S3 + CDN; responsive sizes; AVIF/WebP.
- Cache via Redis + Next cache tags + Cloudflare edge; ISR on publish.
- Tracking is fire-and-forget (`navigator.sendBeacon`/`keepalive`); never blocks navigation.
- Lighthouse budgets: LCP < 2.5s mobile, CLS < 0.1, no layout shift from cards/badges.

## 8. Global shell
Header (logo, search, category nav, language switcher), mobile menu (with switcher), footer
(links, affiliate disclosure, **`Powered by 2T9COME`**, language switcher). `<html lang>` and
metadata set per locale.

## 9. State & client boundaries
Client components: `CategoryFilter`, `SortControl`, `ProductCarousel`, compare tray,
`LanguageSwitcher`, search box, image gallery. Everything else stays server-rendered. Use
TanStack Query only for interactive client lists (e.g., infinite scroll, live filter).

## 10. Responsive — one site, all devices
This is a **responsive website**, not a native app: one codebase, one URL, **mobile-first**,
fluid up to desktop via Tailwind breakpoints (`sm 640 · md 768 · lg 1024 · xl 1280`). Build
mobile layout first, then add `md:`/`lg:` overrides. Key adaptations:

| Element | Mobile (default) | Tablet (`md`) | Desktop (`lg+`) |
|---------|------------------|---------------|------------------|
| Primary nav | bottom tab bar (หน้าแรก/หมวดหมู่/รีวิว/ฉัน) | top bar | top bar (logo · search · nav links · language · ♡ 🔔) |
| Product grid | 2 cols | 3 cols | 4–5 cols (`auto-fit minmax`) |
| Category filters | bottom-sheet drawer | drawer/inline | persistent left sidebar |
| Product detail | single column, sticky `ProductActionBar` | 2 cols (gallery / info) | 2 cols, merchant list in a side rail |
| Footer | single column band | 2 cols | multi-column + the `Powered by 2T9COME` line |
| Hero banner | compact | wide | wide |
| Search | pill in header | inline | inline, wider |

Rules: never ship a desktop-only or mobile-only layout; test 360px → 1440px; images via
`next/image` responsive `sizes`; no horizontal scroll; tap targets ≥ 44px on touch; the footer
credit and language switcher are present at every breakpoint. (No `/m` or app-store build —
the same responsive pages serve every device.)

---

Powered by 2T9COME
