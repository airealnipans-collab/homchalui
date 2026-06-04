# 0005 — Use a section-based Layout Builder

- Status: Accepted
- Date: 2026-06-03

## Context
Marketing/editorial need to rearrange the home and landing pages (trending, editorial picks,
category grids, campaigns) without code deploys, per locale.

## Decision
Model pages as `layout_pages` + ordered `layout_sections` with JSON `config` validated by
`packages/validators/layout.ts` and rendered by `LayoutSectionRenderer`. Section types: hero,
product_carousel, category_grid, trending_list, editorial_picks, article_block, custom_html.

## Consequences
- Non-developers control layout via the backoffice; configs are validated and audited.
- Section titles are localized; data sources (e.g., trending) are locale-filtered.
- `custom_html` is sanitized to prevent XSS.
