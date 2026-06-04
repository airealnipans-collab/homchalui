# UI_MOCKUPS.md — หอมฉลุย screen reference

> Powered by 2T9COME
> Visual reference for every designed screen, for Claude Code to build against. Pairs with
> `PAGE_SPECS.md` (routes/data), `COMPONENT_LIBRARY.md` (component contracts), and
> `DESIGN_SYSTEM.md` (tokens). Style = Shopee-like e-commerce UX, mobile-first, warm theme.
> Layout sketches below are ASCII approximations of the rendered mockups.

## Theme (official tokens — see DESIGN_SYSTEM.md)
`--bg-primary #FFF8F1` · `--bg-secondary #F7EFE6` · `--bg-card #FFFFFF` ·
`--brand #B8895B` (price/CTA/active) · `--brand-dark #7A5436` (headings) ·
`--accent-gold #D8B26E` (stars/badges) · text `#2F2923 / #6F6258 / #9A8D82` ·
tints `--soft-pink #EFC7C2` · `--lavender #DCD4F2` · `--sage #B8C7A8` ·
`--border #E8DCCD` · `--success #6F8F72` · `--warning #D89C45` · `--error #C7665A`.

## Responsive — these mockups are the MOBILE view of a responsive website
This is a **responsive web app** (Next.js), not a native app: one codebase, one URL,
mobile-first, fluid to desktop. The phone-framed sketches below are the small-screen layout;
on `md`/`lg` the same pages reflow per `FRONTEND.md` §10:
- **Nav:** mobile bottom tab bar → desktop **top nav bar** (logo · search · links · language · ♡ 🔔).
- **Product grid:** 2 cols (mobile) → 3 (tablet) → **4–5 (desktop)**.
- **Category filters:** bottom-sheet (mobile) → **left sidebar** (desktop).
- **Product detail:** single column + sticky action bar (mobile) → **2 columns** (gallery / info)
  (desktop).
- **Footer:** single band (mobile) → **multi-column** (desktop) — always ends with `Powered by 2T9COME`.

## Global shell (all customer pages)
- Top: brand header (`--brand` bg) with **หอมฉลุย** wordmark + heart + bell, search pill below
  (mobile) / inline (desktop).
- Mobile nav: bottom tab bar หน้าแรก · หมวดหมู่ · รีวิว · ฉัน (active = `--brand`). Desktop:
  top nav bar (same destinations + language switcher).
- Footer band (`--bg-secondary`): **`Powered by 2T9COME`** — every page, every locale, every
  breakpoint.
- Product images: real photos via `next/image` + R2/CDN with responsive `sizes`. (Mockups use
  vector bottle SVGs only because the chat preview sandbox blocks external image hosts; the app
  has no such limit.)

---

## 1. Home `/`
```
[ หอมฉลุย          ♡ 🔔 ]   brand header
[ 🔍 ค้นหา...            ]
[ HERO BANNER  รีวิวของหอม ]  brand-dark bg + bottle, dots ●○○, "ดูเลย"
( ○น้ำหอม ○เทียน ○ธูป ○สเปรย์ ○รถ )  category circles (tinted)
[ 🔥 มาแรงวันนี้      02:14:33 ]
[ card ][ card ]              2-col product cards (image, -%, badge,
[ card ][ card ]               title, ฿price + struck, ★rating, กดซื้อ N)
เลือกตามงบ: [≤500][≤1,000][≤3,000]
รีวิวล่าสุด  → [ thumb | title | time ]
[ bottom nav ] [ Powered by 2T9COME ]
```
Components: `LayoutSectionRenderer`, `ProductCard`, `Badge`, `ProductCarousel`, `SearchBox`,
`LanguageSwitcher`. Sections are Layout-Builder driven. Trending source = Redis
`rank:trending:{locale}`. Track: `page_view`, `view_item_list`, `select_item`, `search`.

## 2. Category `/category/[slug]`
```
[ ← | 🔍 น้ำหอม | ♡ ]
[ แนะนำ ขายดี ใหม่ ราคา▾        ⚙ ตัวกรอง ]  sort tabs + filter
[ unisex✕ ][ ≤1,000✕ ][ ติดทนดี ]            active filter chips
พบ 128 รายการ
[ card ][ card ]
[ card ][ card ]
[ Powered by 2T9COME ]
```
Components: `SortControl`, `CategoryFilter` (bottom-sheet on mobile), `ProductGrid`,
`Breadcrumb`, `FAQBlock`. Filters URL-synced. Track: `view_item_list`, `filter_apply`,
`sort_apply`. SEO: `ItemList` + `BreadcrumbList`.

## 3. Product detail `/product/[slug]`
```
[ IMAGE (gallery)  ← ⤴♡   1/4 ]   bottle on tint
[ ฿339  ฿̶3̶9̶9̶  -15% ]            price block (--bg-secondary)
Le Labe Fresh Tea ... unisex
★4.3 | 27 รีวิว | กดซื้อ 412
[ กลิ่น ▮▮▮▮ 8.5 / ติดทน 7.0 / คุ้มค่า 8.0 ]  RatingBreakdown
[ AEO summary box (lavender) ]
[ bergamot ][ white tea ][ jasmine ][ white musk ]
ช่องทางซื้อ · เทียบ 3 ร้าน        #merchants
 [ Shopee  ถูกสุด   ฿339  (สั่งซื้อ) ]   ← --success border + filled --brand pill
 [ Lazada           ฿369  (สั่งซื้อ) ]   ← --gold-border pill
 [ TikTok           ฿349  (สั่งซื้อ) ]
affiliate disclosure
[ 💬รีวิว | ⇄เทียบ | ( 🛍 สั่งซื้อ ) ]   ProductActionBar (sticky)
[ Powered by 2T9COME ]
```
Components: `Gallery`, `RatingBreakdown`, `ScentProfile`, `MerchantButton` (label **สั่งซื้อ**,
cheapest highlighted), `ProductActionBar` (รีวิว→`#reviews`, เทียบ→compare tray, สั่งซื้อ→
`#merchants`), `FAQBlock`. All buy CTAs → tracked `/go/:linkId`. JSON-LD: Product + Review +
AggregateRating + FAQPage + BreadcrumbList. Track: `view_item`, `click_merchant_link`,
`affiliate_outbound_click` (server), `scroll_depth`.

## 4. Reviews section (within product, `#reviews`)
```
รีวิวจากผู้ใช้                 ดูทั้งหมด 27 ›
[ 4.3 ★★★★½  | 5★▮▮▮ 15 / 4★▮▮ 8 / 3★▮ 3 / 1-2★ 1 ]
[ ทั้งหมด 27 ][ มีรูป 8 ][ 5 ดาว ][ ติดทนดี ]
[ avatar  ทีมงานหอมฉลุย ★★★★★ 20 พ.ค.   ✓ทดลองจริง ]
   body... [+ข้อดี][−ข้อสังเกต] [img][img]  👍 (12)
[ avatar  ณัฐพร ★★★★ 12 พ.ค.        📣ได้รับสปอนเซอร์ ]
[ ดูรีวิวเพิ่มเติม (25) ]
```
Integrity rule: **tested** badge (`--success`) only when `tested=true`; **sponsored** badge
(`--warning`) when `sponsored=true`; no fake reviews. Track: `read_review`.

## 5. Reviews feed (bottom-nav "รีวิว")
```
รีวิวล่าสุด
[ ทั้งหมด ][ น้ำหอม ][ เทียนหอม ][ มีรูป ]
[ avatar name ★ time ✓ทดลองจริง ]
   snippet... [ product thumb | name | ฿ › ]
[ avatar name ★ time 📣สปอนเซอร์ ]
...
```
Cross-product feed of recent published reviews; each links to its product. Same integrity
labels. Maps to `/reviews` (or `/article` feed). Track: `select_item`.

## 6. Compare `/compare?ids=` (or `/compare/[slug]`)
```
เปรียบเทียบสินค้า
[ ✕  Le Labe  ฿339 ] [ ✕  Rose Aura ฿420 ]   product columns
คะแนนรวม   4.3★         4.6★
กลิ่น      8.5          9.0 (ดีกว่า)            ← --success cell highlight
ติดทน      7.0 (ดีกว่า) 6.0
คุ้มค่า     8.0 (ดีกว่า) 7.0
กลุ่มกลิ่น  fresh-floral sweet-rose
ราคาถูกสุด ฿339         ฿420
[ ดูตัวนี้ ] [ ดูตัวนี้ ]
```
2–4 products; compare tray persisted in `localStorage`. Ad-hoc `?ids=` is `noindex`; curated
`/compare/[slug]` gets `ItemList`+`FAQPage`. Track: `compare_product`.

## 7. Search `/search?q=`
```
[ ← | 🔍 กลิ่นสะอาด ✕ ]
ผลการค้นหา 48 รายการ        เรียง: ตรงที่สุด ▾
[ หมวด ][ ราคา ][ กลุ่มกลิ่น ][ ติดทน ]
[ card (term highlighted) ][ card ]
[ card ][ card ]
```
FTS (Phase 1) → Meilisearch later; logs `search_query_stats` + `zero_result`. Query pages
`noindex`. Empty state: suggestions + popular searches. Track: `search`, `view_item_list`.

## 8. Article / Guide `/article|guide/[slug]`
```
[ COVER (brand-dark + bottle)  คู่มือเลือกซื้อ ]
Title (buying guide)
[ avatar author · time ]
body paragraphs...
1. Le Labe Fresh Tea — rationale
[ product callout: thumb | name ★ ฿ | ดูรีวิว ]
คำถามที่พบบ่อย  [ Q ▲ / A ] [ Q ▼ ]
```
Components: TOC (optional), embedded product callout, `FAQBlock`. JSON-LD: Article + FAQPage +
BreadcrumbList. Track: `page_view`, `scroll_depth`, `select_item`.

## 9. Wishlist (bottom-nav "ฉัน" → saved)
```
♡ รายการที่ถูกใจ              5 รายการ
[ thumb | Le Labe ♥ | ฿339 ★4.3 | (สั่งซื้อ) ]
[ thumb | Rose Aura ♥ | ฿420 ฿̶5̶2̶0̶ | (สั่งซื้อ) ]
[ thumb | Sage Garden ♥ | ฿199 ★4.5 | (สั่งซื้อ) ]
```
Saved products (Phase 3, session/account). Quick **สั่งซื้อ** routes through tracked outbound.
Track: `select_item`, `click_merchant_link`.

## 10. Scent quiz `/quiz`
```
[ ← ค้นหากลิ่นที่ใช่           2/5 ]
[ ▮▮▮▮▮░░░░░ ] progress 40%
คำถามที่ 2
คุณชอบกลิ่นแนวไหนมากที่สุด?
( ◉ สะอาด สดชื่น — ชา ผ้าสะอาด ทะเล )   selected = --brand border + check
( ○ หวาน ดอกไม้ )
( ○ เขียว สมุนไพร )
( ○ อบอุ่น หรูหรา )
[ ถัดไป ]
```
Multi-step; answers feed personalized recommendations + onboarding signal. Result page = a
curated `ItemList` of matched products. Track: custom `quiz_step`/`quiz_complete` (extend the
event catalog) + `view_item_list`.

---

## Backoffice (desktop)

## 11. Login `/admin/login`
```
[ หอมฉลุย — ระบบจัดการหลังบ้าน ]   brand-dark header
เข้าสู่ระบบ
อีเมล    [ ✉ admin@homchalui.com ]
รหัสผ่าน [ 🔒 •••••••• 👁 ]
[●จดจำฉัน]            ลืมรหัสผ่าน?
[ เข้าสู่ระบบ ]
🛡 บัญชีผู้ดูแลเปิด 2FA — ขอรหัสจากแอปหลังกดเข้าสู่ระบบ
```
NextAuth credentials + RBAC; TOTP 2FA. See `SECURITY.md`.

## 12. Dashboard `/admin/dashboard`
```
[ หอมฉลุย Admin            🌐ไทย  นป ]
[nav: แดชบอร์ด* สินค้า รีวิว เลย์เอาต์ SEO แปลภาษา วิเคราะห์ อันดับ]
ภาพรวมวันนี้
[ สินค้า 1,284 ][ รีวิว 3,901 ][ เข้าชม 18,420 ][ คลิกออก 1,203 ]
[ สินค้าคลิกออกเยอะสุด (name · clicks · CTR) ] [ ต้องจัดการ: ลิงก์เสีย4 / ขาดSEO12 / ขาดรูป3 ]
                                               [ สถานะงาน: ✓ranking ✓rollup ⚠link-check ]
```
Metric cards + top-clicked list + alert chips + job status (`system_jobs`). All sliceable by
locale + date. Track-free (admin).

## 13. Product editor `/admin/products/[id]`
```
สินค้า / แก้ไข: Le Labe Fresh Tea   [ฉบับร่าง]   [บันทึกร่าง][เผยแพร่]
[ ข้อมูล* ราคา กลิ่น&คะแนน รูปภาพ ร้านค้า SEO/AEO อันดับ ]
[ ไทย* ][ EN·ร่าง ][ 中文·ขาด ]      locale tabs
ชื่อสินค้า [ ............... ]
Slug [ le-labe-fresh-tea ]   แบรนด์ [ Le Labe ▾ ]
คะแนน: กลิ่น ●——— 8.5 / ติดทน ●—— 7.0 / คุ้มค่า ●—— 8.0   (sliders)
                                   │ sidebar:
                                   │ ความครบถ้วน 80% ▮▮▮▮░
                                   │  ✓รูป ✓3ร้าน ✓SEOไทย ✗แปล EN/中文
                                   │ [ รูปสินค้า ]
```
Field groups per `BACKOFFICE_SPECS.md`; per-locale translation tabs; completeness checklist;
unique-slug + price validation; audit on save.

---

## Proposed additional screens (optional, not yet mocked in detail)
- **Onboarding** (first open): welcome + language picker (th/en/zh) + first-run affiliate
  disclosure/consent → optional jump into the scent quiz. Sets locale cookie + session signal.
  Keep it skippable; never block content.
- **User profile** ("ฉัน" tab, Phase 3): account header, wishlist, recently viewed, my reviews,
  language/notification settings, sign in/out. Gated behind accounts (Phase 3 roadmap).
- Others to consider: campaign landing page, best-list hub, brand index, notifications.

## Build notes for Claude Code
- Reuse one `ProductCard` everywhere (home/category/search/brand/scent/best).
- One `CategoryFilter` + `SortControl` shared by category and search.
- All buy CTAs (cards, product, wishlist) → `MerchantButton`/`/go/:linkId` (tracked). Never a
  raw affiliate `href`.
- Footer + `<html lang>` + language switcher on every page; **no Thai fallback** on `/en`,`/zh`.
- Colors only via tokens (`brand`, `gold`, `pink`, `lavender`, `sage`, `success`, `warning`,
  `error`, `text-*`). No ad-hoc hex.
- Icons: wire a Tabler webfont (or swap to `lucide-react`) — `ProductActionBar` uses `ti ti-*`
  classes as placeholders.

---

Powered by 2T9COME
