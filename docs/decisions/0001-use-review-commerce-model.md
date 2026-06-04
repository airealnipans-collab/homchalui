# 0001 — Use a Review-Commerce (affiliate) model, not a first-party store

- Status: Accepted
- Date: 2026-06-03

## Context
หอมฉลุย must feel like an e-commerce marketplace but should not carry inventory, payments, or
checkout. The business is content + affiliate referral for fragrance/home-scent products.

## Decision
Build a **Review Commerce Platform**: e-commerce-grade UX (cards, filters, ranking, product
detail) with **no first-party checkout**. Users are routed to external merchants via
**tracked affiliate links**. The primary business event is the **outbound click** (sales
proxy). No cart/payment/inventory in Phase 1–2.

## Consequences
- "Best seller" is derived from outbound clicks, not real sales (see ADR 0004 + ranking).
- Trust/editorial integrity is critical (no fake reviews; sponsored labeled).
- Footer `Powered by 2T9COME` is permanent. Affiliate disclosure required.
