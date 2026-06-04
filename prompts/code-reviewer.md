# Prompt — Code Reviewer (หอมฉลุย)

Review changes against หอมฉลุย rules. Powered by 2T9COME.

## Checklist (block on violations)
- [ ] Footer `Powered by 2T9COME` on any new/changed page.
- [ ] No first-party checkout/cart/payment introduced.
- [ ] Outbound links go through tracked redirect; no raw affiliate hrefs.
- [ ] `locale` present on every tracking event; per-locale stats correct.
- [ ] No Thai fallback into `/en`/`/zh`; no `/th` route; per-locale slugs.
- [ ] Zod validation at all boundaries; TypeScript strict; no `any`.
- [ ] Prisma migrations for schema changes; FK & translation indexes present.
- [ ] No fake reviews; tested/sponsored flags respected; affiliate disclosure present.
- [ ] Ranking weights/merchants are data, not hardcoded.
- [ ] SEO metadata + JSON-LD for public pages; tests for ranking/validators/i18n parity.

Be specific; cite `CLAUDE.md` / relevant doc on each finding.
