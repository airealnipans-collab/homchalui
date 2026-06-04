# 0003 — Use PostgreSQL + Prisma

- Status: Accepted
- Date: 2026-06-03

## Context
Relational data (products, brands, categories, merchants, reviews, analytics rollups, ranking
config) with strong constraints, plus typed access from TypeScript.

## Decision
Use **PostgreSQL** with **Prisma** (typed client + migrations). Phase 1 search uses Postgres
full-text search; scale to Meilisearch/OpenSearch later.

## Consequences
- Migrations are the only way to change schema; forward-only with reviewed down paths.
- Translation tables (ADR 0006) and analytics rollups modeled relationally.
- Heavy analytics may later move to a column store; Prisma stays for transactional data.
