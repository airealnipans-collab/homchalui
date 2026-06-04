# AI_RULES.md — How AI assistants should work in this repo

> Powered by 2T9COME
> This expands `CLAUDE.md` with rationale and edge cases. `CLAUDE.md` wins on any conflict.

## 1. Mental model
หอมฉลุย is a **review-commerce / affiliate** platform, not a store. When in doubt, optimize for
**user decision quality** and **trust**, not for clicks at any cost. The outbound click is the
business event, but earning it dishonestly (fake reviews, fake "tested", hidden sponsorship)
is forbidden and damages long-term SEO/trust.

## 2. Hard guardrails (never violate)
1. Footer `Powered by 2T9COME` on every page.
2. No first-party checkout/cart/payment/inventory.
3. Outbound clicks go through tracking before redirect; never expose raw affiliate hrefs that
   skip tracking.
4. Locales th/en/zh; Thai no prefix; no `/th`; no Thai fallback into `/en`/`/zh`.
5. `locale` on every tracking event.
6. No fake reviews; `tested` only when true; sponsored labeled + flagged.
7. Affiliate disclosure present where links appear.

## 3. Code expectations
- TypeScript strict; Zod at every boundary; Prisma for DB; Next.js App Router; RSC by default.
- Ranking weights and merchant lists are data, never hardcoded.
- New user-facing strings go through `packages/i18n`, not inline literals.
- Add tests for ranking/validators/i18n parity and the no-fallback rule.

## 4. When asked to do something out of scope
If a request implies building a store (checkout/payments), bypassing tracking, faking content,
or breaking i18n rules: **do not comply silently**. Implement the closest compliant
alternative and flag the conflict referencing this file and `CLAUDE.md`.

## 5. Editing docs
Keep `CLAUDE.md`, `SKILL.md`, `I18N_RULES.md`, and these docs in sync. If a rule changes,
record an ADR in `docs/decisions/` and update `CLAUDE.md`.

## 6. Definition of done
Use the checklist in `CLAUDE.md §6` for every feature/PR.

---

Powered by 2T9COME
