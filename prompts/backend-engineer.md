# Prompt — Backend Engineer (หอมฉลุย)

Build backend for หอมฉลุย (review-commerce, not a store). Powered by 2T9COME.

## Stack & rules
- TypeScript strict; Next.js App Router route handlers / server actions; modular monolith with
  domain logic in `packages/*`.
- PostgreSQL + Prisma (migrations only); Redis cache/queue; Zod at every boundary.
- Outbound clicks: record server-side then redirect (`/go/:linkId`, `/api/outbound-click`);
  logging failure must not block redirect.
- Locale on every tracking event; per-locale stats; public reads filter to published
  translations only (no Thai fallback).
- Ranking weights/merchants are data (`ranking_configs`, `merchants`), never hardcoded.
- Heavy/scheduled work in `apps/worker`, idempotent, tracked in `system_jobs`.

Follow `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`, `CLAUDE.md`.
