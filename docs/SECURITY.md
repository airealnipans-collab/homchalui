# SECURITY.md — หอมฉลุย

> Powered by 2T9COME

## AuthN / AuthZ
- Backoffice login via NextAuth (credentials + optional SSO). Passwords hashed (argon2/bcrypt).
- **RBAC**: roles (Super Admin, Admin, Editor, SEO Manager, Translator, Analyst, Viewer) →
  permissions checked on every admin route/action.
- **2FA (TOTP)** for admin accounts where feasible (`users.totp_secret`).
- Session management: short-lived, httpOnly + secure cookies, idle + absolute timeout, server
  revocation; re-auth for sensitive actions.

## Web protections
- **CSRF** protection on all mutating browser requests.
- **XSS**: escape by default; sanitize `custom_html` layout sections and any rich text; strict
  CSP; no `dangerouslySetInnerHTML` without sanitization.
- **Rate limiting** on public (search, tracking) and auth endpoints (Redis-backed).
- **Input validation** with Zod at every boundary; reject unknown fields.
- **Upload validation**: type/size/dimension checks, content sniffing, store in R2/S3 with
  random keys; serve via CDN; never execute uploads.

## Affiliate redirect safety
- Only redirect to URLs whose domain matches an allow-listed `merchants.base_domain`.
- Validate `linkId` ownership; expire/disable broken links; no open redirect.

## Secrets & data
- Secrets via env/secret manager (never in repo); `.env` git-ignored; rotate keys.
- Least-privilege DB users; TLS to DB; encrypted backups; PII minimization (analytics avoid
  storing raw PII).
- **Audit log** (`admin_audit_logs`) for all significant admin actions (actor, before/after, ip).

## Backups & recovery
- Automated daily Postgres backups + periodic restore tests; media in versioned R2/S3.
- Documented recovery runbook; migrations forward-only with reviewed rollback.

## API authentication
- Admin API: session + RBAC. Service-to-service (worker): signed token / mTLS. Public API:
  unauthenticated reads with rate limits; no secrets exposed to client.
