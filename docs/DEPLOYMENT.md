# DEPLOYMENT.md — หอมฉลุย DevOps

> Powered by 2T9COME

## Environments
- **local**: `docker compose up -d` (postgres + redis) + `pnpm dev`. `.env` from `.env.example`.
- **staging**: preview of `main`/PRs (Vercel preview) + staging Postgres/Redis; seeded demo data.
- **production**: Vercel (apps/web) behind Cloudflare (CDN/DNS); managed Postgres + Redis;
  worker host (Railway/Fly.io/Render) for cron/queue; R2/S3 for media.

## Environment variables
Validated by `packages/config/env.ts` (Zod) at boot — see `.env.example`. Includes
`DATABASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`, locale vars, R2/S3,
`NEXTAUTH_SECRET`, `SENTRY_DSN`, and cron schedules. Missing/invalid env fails fast.

## CI/CD (GitHub Actions)
Pipeline: install → lint → typecheck → test → build. On merge to `main`: run
`prisma migrate deploy`, deploy web (Vercel) + worker. Preview env per PR. Required checks
gate merges.

## Migration strategy
Prisma migrations, forward-only, reviewed. `migrate deploy` in release step (never auto-migrate
at runtime). Backwards-compatible deploys (expand/contract) for zero-downtime.

## Jobs / cron / worker (`apps/worker`)
- **ranking recompute** — hourly (trending) / daily (best-click, editorial).
- **stats rollup** — hourly aggregate `tracking_events` → `*_stats`.
- **link checker** — daily; mark broken merchant links; exclude from offers; flag in backoffice.
- **sitemap generation** — daily + on publish; per-locale sitemaps + index.
- **translation jobs** — generate drafts, flag outdated on Thai-source edits.
All jobs idempotent, status tracked in `system_jobs`.

## Caching & invalidation
Redis (hot payloads, ranking snapshots, counters) + Next cache tags per entity + Cloudflare
edge. Invalidate tags on publish/update; never cache the outbound redirect.

## Logging / monitoring
- **Pino** structured logs (no PII); **Sentry** errors/performance; **OpenTelemetry** traces.
- Uptime via UptimeRobot / Better Stack; alert on job failures (`system_jobs.status='failed'`)
  and error-rate spikes. Dashboards in Grafana/OpenSearch later.

## Rollback
Vercel instant rollback for web; worker redeploy of previous image; DB via reviewed down
migration or restore from backup. Ranking config rollback via `ranking_configs` versions.
