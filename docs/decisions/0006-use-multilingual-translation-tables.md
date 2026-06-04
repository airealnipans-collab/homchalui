# 0006 — Use translation tables for multilingual content

- Status: Accepted
- Date: 2026-06-03

## Context
Three locales (th default, en, zh) with per-locale slugs, SEO/AEO fields, and a translation
workflow with status. Thai is the source of truth; no fallback into other locales.

## Decision
Store locale-specific text in dedicated **translation tables** (`product_translations`,
`category_translations`, `brand_translations`, `article_translations`) rather than JSONB blobs
on base rows. Base tables hold locale-independent data. Enforce `UNIQUE(entity_id, locale)` and
`UNIQUE(locale, slug)`; track `translation_status` per row.

## Consequences
- Clean per-locale querying, indexing, and slug uniqueness; easy "missing/outdated" reporting.
- Public reads filter to `translation_status = 'published'`; no Thai fallback (ADR aligns with
  `I18N_RULES.md`).
- Slightly more joins than JSONB, accepted for correctness and SEO control.
