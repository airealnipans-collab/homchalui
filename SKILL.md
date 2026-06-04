---
name: Homchalui Review Commerce Builder
description: >
  Design, build, and maintain "หอมฉลุย" — a review-commerce / affiliate platform for
  fragrance and home-scent products. Use for product review pages, SEO/AEO content,
  database & API design, backoffice features, tracking specs, ranking algorithms, UX/UI,
  multilingual (th/en/zh) content and translation workflow. NOT a first-party store.
---

# Homchalui Review Commerce Builder

## Purpose
ช่วยออกแบบ สร้าง พัฒนา และดูแลแพลตฟอร์ม **หอมฉลุย** ซึ่งเป็นเว็บ **review-commerce /
affiliate** สำหรับสินค้ากลิ่นหอม — ไม่ใช่ร้านค้าที่ขายเอง.

## What this skill can do
- Design product review & product detail pages (e-commerce-like UX).
- Generate SEO + AEO content (summary, FAQ, pros/cons, best-for / not-for, schema).
- Design and evolve the PostgreSQL / Prisma database schema (incl. translation tables).
- Design backoffice features (product CMS, review mgmt, layout builder, SEO mgr, analytics).
- Author tracking event specs and the `dataLayer` / GTM design.
- Write product review templates and editorial scoring rubrics.
- Design ranking & recommendation algorithms (trending, best-click, editorial, similar,
  personalized) — locale-aware.
- Review UX/UI flows and component APIs.
- Generate public & admin API specs (locale-aware).
- Plan the development roadmap (MVP → Growth → Scale).
- Handle multilingual content and the translation workflow (Thai = source of truth).

## Business context
หอมฉลุยไม่ใช่ร้านค้าโดยตรง. เป็น review-commerce + affiliate content platform: ผู้ใช้รู้สึก
เหมือนช้อปจริง แต่จริง ๆ คืออ่านรีวิว เปรียบเทียบ แล้วกดออกไปซื้อผ่าน merchant. Revenue proxy =
**outbound clicks**, ไม่ใช่ยอดขายภายในเว็บ.

## Brand rules
- **Brand name:** หอมฉลุย (Homchalui)
- **Footer (every page):** `Powered by 2T9COME`
- **Tone:** friendly, trustworthy, clear, practical.
- Avoid looking like a scam affiliate site; prioritize **user decision quality** over
  aggressive selling.
- Affiliate relationships are disclosed; sponsored content is labeled.

## Product categories
Perfume · Scented candle · Incense · Room spray · Bathroom fragrance · Car fragrance ·
Home fragrance · Miscellaneous scent products.

## Internationalization
- Thai is the **source language** and **default locale** (`th`).
- Supported: `th`, `en`, `zh`.
- **Thai URLs have no prefix**; English uses `/en`; Chinese uses `/zh`.
- **No fallback** of Thai content into other localized SEO pages — untranslated localized
  pages are not published/indexed.
- Every tracking event carries `locale`. Trending/click/search stats are stored per-locale.

## How to use this skill
1. Read `CLAUDE.md` and `docs/PROJECT.md` first.
2. For data work, read `docs/DATABASE.md` + `packages/db/prisma/schema.prisma`.
3. For content, follow `docs/CONTENT_STYLE.md`, `docs/SEO_AEO.md`, `I18N_RULES.md`.
4. Use the canonical shapes in `examples/*.json` and validators in `packages/validators`.
5. Respect every rule in `CLAUDE.md §2` (footer, outbound tracking, locale, no fake reviews).

---

Powered by 2T9COME
