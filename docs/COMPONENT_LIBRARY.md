# COMPONENT_LIBRARY.md — หอมฉลุย UI components

> Powered by 2T9COME
> Contracts for every shared component. Server Component unless marked **(client)**. Shared
> components live in `packages/ui`; app-specific compositions in `apps/web/components`. Styling
> via Tailwind + design tokens (`DESIGN_SYSTEM.md`). Strings come from `@homchalui/i18n`.

## Conventions
- Props are TypeScript interfaces; no required prop without a sensible default.
- Any component that triggers analytics pushes to `window.dataLayer` with `locale` included.
- Money formatted via `Intl.NumberFormat(locale, { currency })`.

---

## Display

### `ProductCard`
e-commerce-style card. **Props:** `{ product: ProductCardVM; locale; listName?; position?; sessionId }`.
`ProductCardVM = { id, slug, name, brand, image, priceMin, currency, rating?, longevity?,
badges: Badge[], outboundClicks?, moodOrOccasion? }`.
Renders image, badges, name, brand, price, rating, "ดูรีวิว" (→ `/product/slug`) + "ไปซื้อ"
(→ product detail anchor or quick merchant sheet). **Track:** `select_item` on click.
States: image fallback; skeleton variant `ProductCard.Skeleton`.

### `ProductGrid`
**Props:** `{ items: ProductCardVM[]; locale; listName; columns?; sessionId }`. Responsive grid;
fires `view_item_list` on mount (IntersectionObserver, **client** wrapper). Empty slot message.

### `ProductCarousel` **(client)**
Horizontal scroll/snap of `ProductCard`. **Props:** `{ title; items; locale; listName; seeAllHref? }`.
Keyboard + touch; lazy-load offscreen images.

### `Badge`
**Props:** `{ kind: "trending"|"best_seller"|"best_value"|"luxury"|"long_lasting"; locale }`.
Maps to localized label + token color (see DESIGN_SYSTEM badge semantics). Derived from data,
never arbitrary.

### `ScentProfile`
Note pyramid. **Props:** `{ topNotes; middleNotes; baseNotes; family; mood?; occasion?; locale }`.
Renders three tiers + family chip; notes link to `/scent/[family]` where applicable.

### `RatingBreakdown`
Per-axis bars. **Props:** `{ overall; scores: { scent; longevity; projection; value; ... }; scale?=10; locale }`.
Consistent scale everywhere; numeric + bar; accessible labels.

### `ReviewSummary`
**Props:** `{ summary; pros; cons; bestFor?; notFor?; tested?; sponsored?; locale }`.
Shows quick verdict; renders **Tested** and **Sponsored** badges from flags (integrity rule).

### `Breadcrumb`
**Props:** `{ items: { label; href? }[]; locale }`. Emits `BreadcrumbList` JSON-LD (caller may
also emit; avoid duplication — component returns markup, page owns JSON-LD).

### `FAQBlock`
**Props:** `{ items: { q; a }[]; locale }`. Accordion **(client)**; page emits `FAQPage` JSON-LD
from the same data.

### `AffiliateDisclosure`
**Props:** `{ locale }`. Short localized disclosure; rendered near merchant CTAs and in footer.

### `Footer` ✅
Always renders `Powered by 2T9COME` + `AffiliateDisclosure`. **Props:** `{ locale }`.

---

## Interaction (client)

### `MerchantButton` ✅ **(client)**
**Props:** `{ linkId; merchant; productId; productName; locale; price?; currency?; sessionId;
sourcePage; cheapest? }`. Layout: merchant name (left) · price · a filled pill labelled
**"สั่งซื้อ"**. When `cheapest`, show a `--success` "ถูกสุด" tag and a `--success` border; the
primary/cheapest pill is filled `--brand`, others use `--bg-secondary` + `--gold` border.
Pushes `click_merchant_link` then navigates to `/go/:linkId?...`. `rel="nofollow sponsored
noopener"`. Never exposes the raw affiliate URL.

### `ProductActionBar` **(client)**
Sticky bottom bar on the product page. **Props:** `{ locale; reviewCount; merchantCount;
onCompare?; sessionId }`. Three actions: **รีวิว** (icon, scrolls to the reviews section) ·
**เทียบ** (icon, adds the product to the compare tray) · a large filled `--brand` button
**"สั่งซื้อ"** with a bag icon (scrolls to / opens the ช่องทางซื้อ merchant list — which uses
`MerchantButton`, i.e. the tracked outbound flow). Never links to a raw affiliate URL.

### `CategoryFilter` **(client)**
**Props:** `{ facets: FacetConfig; value: FilterState; locale }`. URL-synced (search params).
Facets: price, type, gender/mood, longevity, projection, season, occasion, brand, notes,
family, merchant, rating, value. Mobile = bottom-sheet drawer. **Track:** `filter_apply`.

### `SortControl` **(client)**
**Props:** `{ value; options; locale }`. URL-synced. **Track:** `sort_apply`.

### `SearchBox` **(client)**
**Props:** `{ locale; defaultValue? }`. Debounced suggestions (optional), submits to `/search`.
**Track:** `search`.

### `LanguageSwitcher` **(client)**
**Props:** `{ current: Locale; alternates: Partial<Record<Locale,string>> }`. Maps to the
equivalent localized URL; if a locale alternate is missing ⇒ disabled/"not available", never
Thai fallback, never random redirect. Present in header, mobile menu, footer.

### `CompareTray` **(client)**
**Props:** `{ locale }`. Persists selected product ids in `localStorage`; floating bar with
count + "Compare" (→ `/compare?ids=`). **Track:** `compare_product`.

### `Gallery` **(client)**
Product image gallery with thumbnails, zoom, swipe. **Props:** `{ images; alt; locale }`.

### `ScrollDepthTracker` **(client)**
Invisible; fires `scroll_depth` at 25/50/75/100%. **Props:** `{ pageType }`.

---

## Layout engine

### `LayoutSectionRenderer`
**Props:** `{ sections: LayoutSection[]; locale; sessionId }`. Switches on `section.type`
(hero, product_carousel, category_grid, trending_list, editorial_picks, article_block,
custom_html) and renders the matching component using `section.config` (validated by
`packages/validators/layout.ts`). `custom_html` is sanitized. Hidden if its data source is empty.

---

## View-model mapping
Server services (`apps/web/lib/*`) map DB rows → `*VM` objects; components are presentational
and never call the DB. This keeps caching in the service layer and components testable.

---

Powered by 2T9COME
