# CODING_STANDARDS.md — หอมฉลุย

> Powered by 2T9COME

## Language & types
- TypeScript `strict: true`. No `any`; prefer `unknown` + Zod narrowing. Explicit return types
  on exported functions. `satisfies` for config objects.

## Validation
- **Zod everywhere at boundaries:** API request/response, env (`packages/config/env.ts`),
  forms (RHF + zodResolver), tracking payloads, layout-section configs, SEO overrides. Infer
  types from schemas (`z.infer`), don't duplicate.

## Next.js / React
- App Router. **Server Components by default**; `"use client"` only when necessary (state,
  effects, browser APIs, event handlers).
- Data fetching in server components / server actions; cache with tags; revalidate on publish.
- No secrets in client components. `NEXT_PUBLIC_*` only for genuinely public values.

## Database / Prisma
- All schema changes via migrations. No destructive raw SQL in app code. Use transactions for
  multi-table writes. Index every foreign key and every `(entity_id, locale)` translation
  lookup (see `docs/DATABASE.md`).

## Naming & structure
- Files/dirs `kebab-case`; React components `PascalCase`; vars/functions `camelCase`; DB
  tables/columns `snake_case`; enums `UPPER_SNAKE` or Prisma enums.
- Domain logic in `packages/*`, not in route handlers/components.

## Styling
- Tailwind + shadcn/ui; use design tokens from `docs/DESIGN_SYSTEM.md`; no ad-hoc hex colors.
- Mobile-first; respect a11y (semantic HTML, labels, contrast, keyboard).

## i18n
- No hardcoded user-facing strings; use `packages/i18n`. Per-locale slugs. Never `/th`. Never
  Thai fallback into `/en`/`/zh`.

## Errors, logging, observability
- Pino structured logs (no PII); Sentry for exceptions. User-facing errors are localized and
  friendly. Logging failure must never break the outbound redirect.

## Testing
- Unit-test `packages/ranking`, `packages/validators`, i18n key parity, and the no-fallback
  rule. Component tests for `MerchantButton` (tracking), `ProductCard`, `LayoutSectionRenderer`.
  E2E smoke: home/category/product render with footer + correct metadata per locale.

## Git / PR
- Conventional Commits. Small PRs. CI must pass: lint, typecheck, test, build. PR checklist =
  `CLAUDE.md §6`. Significant decisions get an ADR in `docs/decisions/`.

---

Powered by 2T9COME
