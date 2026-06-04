# I18N_RULES.md — Internationalization rules (th / en / zh)

These rules are binding. They are summarized in `CLAUDE.md §2`; this file is the detailed
reference. See also `docs/INTERNATIONALIZATION.md`, `docs/MULTILINGUAL_SEO.md`,
`docs/TRANSLATION_WORKFLOW.md`, `docs/LOCALE_CONTENT_RULES.md`.

## 1. Locales

| code | label (native) | role               | URL prefix |
|------|----------------|--------------------|------------|
| `th` | ไทย            | **default / source** | **none**   |
| `en` | English        | secondary          | `/en`      |
| `zh` | 中文           | secondary          | `/zh`      |

- `defaultLocale = "th"`.
- First visit defaults to **Thai**. (Optional: a one-time geo/Accept-Language *suggestion*
  banner is allowed, but the default served route is Thai and must not auto-redirect away.)

## 2. URL structure

```
Thai (default, NO prefix)        English (/en)              Chinese (/zh)
/                                /en                        /zh
/product/[slug-th]               /en/product/[slug-en]      /zh/product/[slug-zh]
/category/[slug-th]              /en/category/[slug-en]     /zh/category/[slug-zh]
/brand/[slug-th]                 /en/brand/[slug-en]        /zh/brand/[slug-zh]
/best/[slug-th]                  /en/best/[slug-en]         /zh/best/[slug-zh]
/article/[slug-th]               /en/article/[slug-en]      /zh/article/[slug-zh]
```

- **Slugs are per-locale** and stored in `*_translations`. Never reuse a Thai slug under
  `/en` or `/zh`.
- Implement with Next.js middleware + `[[...]]` or a `(locale)` segment that treats absence of
  prefix as `th`. **Never** generate a `/th` route.

## 3. No-fallback rule (critical)

- It is **forbidden** to render Thai text on an `/en` or `/zh` page when the translation is
  missing.
- If a localized translation is **not `published`**:
  - The localized page must return **404** or **redirect to the localized homepage/category**
    (never to the Thai page), AND
  - It must **not** appear in that locale's sitemap, AND
  - It must **not** emit an `hreflang` alternate pointing to it, AND
  - If somehow reachable, it must be `noindex`.
- The backoffice surfaces every missing/outdated translation (see `docs/BACKOFFICE.md`).

## 4. Translation data model

Use **translation tables**, not JSONB blobs on the base row. Base tables hold
locale-independent data (ids, prices, images, scores, status); `*_translations` hold
locale-specific text + slug + SEO/AEO + workflow status. See `docs/DATABASE.md`.

Translatable entities: `product_translations`, `category_translations`,
`brand_translations`, `article_translations` (plus FAQ, SEO fields within them).

## 5. Translation status lifecycle

```
missing → draft → machine_translated → needs_review → approved → published
                                                                    │
                                          (source th edited) ───────┴──► outdated → needs_review → ...
```

- Only `published` translations are served, indexed, sitemapped, and hreflang-linked.
- When the **Thai source** of an entity changes, all non-Thai translations are auto-flagged
  **`outdated`** (still served until re-approved, but flagged in backoffice and queued).

## 6. Content workflow (Thai = source of truth)

1. Write Thai content → 2. Publish Thai → 3. Create EN draft (may be machine-translated) →
4. **Human review** EN → 5. Publish EN → 6. Create ZH draft → 7. **Human review** ZH →
8. Publish ZH. Machine translation alone is never auto-published.

## 7. Multilingual SEO

Each published localized page emits:
- localized `title`, `meta description`, OG title/description/image, canonical (self,
  localized).
- `hreflang` alternates **only for locales with a published translation**, plus
  `x-default` → Thai.
- Entry in the **localized sitemap** (`/sitemap-th.xml`, `/sitemap-en.xml`,
  `/sitemap-zh.xml`, indexed by `/sitemap.xml`).
- Localized FAQ + JSON-LD (`inLanguage` set correctly).

Example `hreflang` head for a product translated into all three:
```html
<link rel="alternate" hreflang="th" href="https://homchalui.com/product/slug-th" />
<link rel="alternate" hreflang="en" href="https://homchalui.com/en/product/slug-en" />
<link rel="alternate" hreflang="zh" href="https://homchalui.com/zh/product/slug-zh" />
<link rel="alternate" hreflang="x-default" href="https://homchalui.com/product/slug-th" />
```

## 8. Language switcher

- Present in header, mobile menu, and footer.
- Switching goes to the **equivalent page** in the target locale (resolve via the entity's
  translation for that locale).
- If the target translation is not published, do **not** guess — show "not available in this
  language yet" and offer the localized homepage/category. Never redirect randomly and never
  show Thai content.

## 9. Analytics & ranking by locale

- Every tracking event carries `locale`.
- `product_hourly_stats` / `product_daily_stats` are keyed by `(product_id, locale)`.
- Trending / best-click / search ranking is computed **per locale**.
- `editorial_score` may be global (locale-independent), but its display copy is localized.
- Backoffice reports traffic, CTR, outbound clicks, search keywords, and "should-translate"
  candidates **per locale**.

## 10. Formatting

- Currency default THB; show locale-appropriate currency formatting. Prices are stored once
  (base table) and formatted per locale; do not store translated price text as truth.
- Dates/numbers formatted per locale (`Intl`).
- `lang` and `dir` attributes set correctly (`dir="ltr"` for all three).

---

Powered by 2T9COME
