# HANDOFF — หอมฉลุย → Claude Code

> Powered by 2T9COME
> The design + scaffold are complete. This file tells Claude Code how to (1) push to GitHub and
> (2) start building. Run Claude Code from the project root: `C:\Project\homchalui`.

## 0. One-time prerequisites (in your terminal)
```bash
git --version            # ensure git is installed
gh auth status           # ensure GitHub CLI is logged in (else: gh auth login)
corepack enable && corepack prepare pnpm@9 --activate   # pnpm
```

## 1. Push to GitHub
```bash
cd C:\Project\homchalui
git init -b main
git add -A
git commit -m "chore: initial scaffold + design docs (หอมฉลุย review-commerce platform)"
gh repo create homchalui --private --source=. --remote=origin --push
```
(Use `--public` instead of `--private` if you want it public. Repo name can be changed.)

Sanity check before committing: confirm `.env` is NOT staged (only `.env.example` should be) —
`git status` should not list any real secrets.

## 2. Kick off the build (paste this to Claude Code)
> Read `CLAUDE.md`, `docs/PROJECT.md`, and `docs/BUILD_PLAN.md` first and follow every rule in
> `CLAUDE.md`. Then implement `docs/BUILD_PLAN.md` work package by work package starting at
> **WP1**, in order. For each WP: create the listed files, satisfy its acceptance criteria and
> the global gates in `CLAUDE.md §6`, run lint/typecheck/test/build, then commit with a
> Conventional Commit message and open a PR (or commit to a feature branch). Pause after each
> WP for review. Use the specs in `docs/PAGE_SPECS.md`, `docs/COMPONENT_LIBRARY.md`,
> `docs/API_CONTRACTS.md`, `docs/BACKOFFICE_SPECS.md`, `docs/DATABASE.md`,
> `docs/UI_MOCKUPS.md`, and the official theme in `apps/web/app/globals.css`. The real brand
> logo kit is in `apps/web/public/brand/production_logo/` and is already wired via
> `components/Logo.tsx`. Do not break: footer `Powered by 2T9COME` on every page, tracked
> outbound (`/go/:linkId`), locale on every event, no Thai fallback, no fake reviews.

## 3. Build order (from BUILD_PLAN.md)
WP1 foundation hardening → WP2 search/listing APIs → WP3 category/brand/scent + shared list
components → WP4 `/en` `/zh` routing → WP5 sitemaps/SEO → WP6 backoffice auth+RBAC+product CRUD
→ WP7 tracking/GTM. Then Phase 2 (WP8–14), Phase 3 (WP15–21).

## 4. Run locally
```bash
pnpm install
docker compose up -d
pnpm --filter @homchalui/db migrate:dev
pnpm --filter @homchalui/db seed
pnpm dev   # http://localhost:3000  → /  and  /product/le-labe-fresh-tea
```

---

Powered by 2T9COME
