# LOCALIZATION.md — หอมฉลุย

> Powered by 2T9COME
> Practical localization guide. Binding rules: `I18N_RULES.md`. Implementation:
> `docs/INTERNATIONALIZATION.md`.

## Scope
- **UI chrome** (buttons, nav, labels, footer) → `packages/i18n/dictionaries/{th,en,zh}.ts`.
- **Content** (products, reviews, categories, brands, articles, SEO/AEO) → DB translation tables.

## Guidelines
- Write natively per locale (no machine-literal translationese for published content).
- Currency stored in THB once; format per locale with `Intl`. Dates/numbers via `Intl`.
- Keep keys stable; key-parity test ensures th/en/zh have the same dictionary keys.
- CJK (zh) typography & line-breaking considered in the design system.

## Checklist when adding a string
- [ ] Added to all three dictionaries (or queued for translation).
- [ ] No hardcoded literal in component.
- [ ] Pluralization/interpolation handled per locale.
