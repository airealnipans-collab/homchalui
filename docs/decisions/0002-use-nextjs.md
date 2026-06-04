# 0002 — Use Next.js (App Router) as the full-stack framework

- Status: Accepted
- Date: 2026-06-03

## Context
We need strong SEO/AEO (server-rendered HTML), i18n routing (th no-prefix, /en, /zh), an
integrated backoffice, and API endpoints — initially as one deployable.

## Decision
Use **Next.js App Router + TypeScript**. Server Components by default; client components only
where needed. Front website, backoffice (`/admin`), and API (route handlers + server actions)
live in `apps/web` as a modular monolith. Deploy on Vercel behind Cloudflare.

## Consequences
- Excellent SSR/ISR for SEO; built-in metadata APIs for hreflang/canonical/OG.
- Locale routing via middleware (never `/th`).
- Domain logic kept in `packages/*` to allow later extraction to NestJS/Fastify (ADR pending
  if/when needed).
