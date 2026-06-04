# LOCALE_CONTENT_RULES.md — หอมฉลุย

> Powered by 2T9COME
> Binding rules: `I18N_RULES.md`. This is the quick "do / don't" for content per locale.

## Do
- Serve only `published` translations for the requested locale.
- 404/redirect to localized home/category when a translation is missing; exclude from
  sitemap + hreflang.
- Use per-locale slugs; write natively per locale.
- Keep prices/scores/merchant facts consistent across locales (translate text, not facts).

## Don't
- ❌ Show Thai content on `/en` or `/zh`.
- ❌ Create a `/th` route.
- ❌ Emit hreflang/sitemap/metadata for unpublished localized pages.
- ❌ Auto-publish machine translations.
- ❌ Redirect "randomly" on language switch — map to the equivalent entity or show
  "not available yet".

## Fallback matrix
| Requested locale | Translation status | Behavior |
|------------------|--------------------|----------|
| th | published | serve |
| en/zh | published | serve |
| en/zh | draft/needs_review/missing | 404 or redirect to localized home; noindex; not in sitemap |
| en/zh | outdated | serve (flagged) until re-approved |
