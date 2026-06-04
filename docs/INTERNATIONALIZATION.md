# INTERNATIONALIZATION.md — หอมฉลุย i18n implementation

> Powered by 2T9COME
> Rules live in `I18N_RULES.md`; this doc is the implementation guide. Companion docs:
> `docs/LOCALIZATION.md`, `docs/MULTILINGUAL_SEO.md`, `docs/TRANSLATION_WORKFLOW.md`,
> `docs/LOCALE_CONTENT_RULES.md`.

## 1. Locale config
Single source: `packages/i18n/src/config.ts` (`LOCALES`, `DEFAULT_LOCALE = "th"`,
`PREFIXED_LOCALES = ["en","zh"]`, `localizedPath`, `localeFromPath`). Never duplicate locale
lists elsewhere.

## 2. Routing (Next.js App Router)
- `middleware.ts` resolves locale from the first path segment: if it's `en`/`zh` → that
  locale; otherwise → `th` (no prefix). It never produces `/th`.
- App structure: a default `(site)` group for Thai and a `[locale]` segment for `en`/`zh`
  mirroring the same route tree, or a unified `[[...locale]]` approach — either way the
  resolved `locale` is passed to pages via params/context.
- `generateStaticParams`/`generateMetadata` use the resolved locale for slugs and metadata.

## 3. Slugs
Per-locale slugs from `*_translations.slug`. Resolve `(locale, slug)` → entity id. The
language switcher maps the current entity to its translation's slug in the target locale.

## 4. Dictionaries (UI strings)
`packages/i18n/dictionaries/{th,en,zh}.ts` for static UI copy (buttons, labels, nav, footer).
No hardcoded user-facing strings in components. Content text (product/review/article) comes
from the DB translation tables, not dictionaries.

## 5. Fallback policy
None for content. If a content translation isn't `published`, the localized page is not served
as Thai — it 404s/redirects to the localized home/category and is excluded from sitemap +
hreflang. UI dictionary keys may fall back to Thai only for *chrome* strings if a key is
missing during development (should be caught by a key-parity test before release).

## 6. Formatting
Use `Intl` for dates/numbers/currency keyed by locale; `LOCALE_CURRENCY` defaults to THB.
Prices stored once on the base row; never store translated price text as canonical.

## 7. Testing
- Key-parity test: every dictionary key exists in th/en/zh.
- Route test: `/th/...` never resolves; `/`, `/en`, `/zh` resolve correctly.
- No-fallback test: an entity with only Thai published returns 404/redirect on `/en` and `/zh`
  and is absent from `sitemap-en/zh`.

---

Powered by 2T9COME
