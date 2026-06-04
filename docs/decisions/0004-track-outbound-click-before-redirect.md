# 0004 — Track outbound clicks before redirecting

- Status: Accepted
- Date: 2026-06-03

## Context
Outbound clicks are the core business metric and the "best seller" proxy. They must be
captured reliably, independent of client analytics/ad-block/consent.

## Decision
All merchant buy actions go through an internal endpoint first:
`/go/:linkId` (or `POST /api/outbound-click`) **records the event server-side**
(`affiliate_outbound_click` with `locale`, product, merchant, session) and **then issues a
302/307 redirect** to the affiliate URL. Raw affiliate hrefs are never rendered directly.

## Consequences
- Reliable first-party attribution + ranking input even without client JS.
- Logging is best-effort; the **redirect is guaranteed** even if logging fails (never block UX).
- The endpoint is rate-limited and resilient; affiliate URLs validated against `merchants`.
