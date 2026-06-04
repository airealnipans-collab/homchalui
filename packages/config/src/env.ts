// packages/config/src/env.ts
// Zod-validated environment for หอมฉลุย. Powered by 2T9COME.
// Fails fast at boot if anything is missing/invalid. Server + client (NEXT_PUBLIC_) split.
//
// Usage:
//   import { env } from "@homchalui/config/env";   // server (full)
//   import { clientEnv } from "@homchalui/config/env"; // client-safe subset
//
import { z } from "zod";

/** Reusable refinements */
// Empty env values arrive as "" (e.g. `DATABASE_REPLICA_URL=` in .env). Treat blank as unset so
// optional fields validate. Applied to every optional field below.
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const url = z.string().url();
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const cron = z
  .string()
  .regex(/^(\S+\s+){4}\S+$/, "must be a 5-field cron expression");

/** Comma-separated locale list, e.g. "th,en,zh" */
const localeList = z
  .string()
  .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
  .pipe(z.array(z.enum(["th", "en", "zh"])).min(1));

// ───────────────────────── Server schema (never sent to the browser) ─────────────────────────
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database (primary required; replica optional — used for read scaling, see SCALABILITY.md)
  DATABASE_URL: url,
  DATABASE_REPLICA_URL: optionalUrl,
  // Pooled connection string (PgBouncer). If set, Prisma should use this for queries.
  DATABASE_POOL_URL: optionalUrl,

  // Redis (primary required; replica optional — reads can target the replica)
  REDIS_URL: url,
  REDIS_REPLICA_URL: optionalUrl,
  REDIS_KEY_PREFIX: z.string().default("hc:"),

  // Auth (backoffice)
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be >= 16 chars"),
  NEXTAUTH_URL: optionalUrl,

  // Object storage (Cloudflare R2 / S3-compatible)
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: z.string().default("homchalui-media"),
  R2_PUBLIC_BASE_URL: optionalUrl,

  // Observability
  SENTRY_DSN: optionalString,

  // Worker / job schedules (cron)
  RANKING_RECALC_CRON: cron.default("0 * * * *"),
  STATS_ROLLUP_CRON: cron.default("15 * * * *"),
  LINK_CHECK_CRON: cron.default("0 3 * * *"),
  SITEMAP_CRON: cron.default("30 3 * * *"),

  // Rate limiting (req/window) — see packages/redis ratelimit
  RATE_LIMIT_SEARCH_PER_MIN: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_TRACK_PER_MIN: z.coerce.number().int().positive().default(600),
  RATE_LIMIT_GO_PER_MIN: z.coerce.number().int().positive().default(120),
});

// ───────────────────────── Client schema (safe to expose; must be NEXT_PUBLIC_) ─────────────────────────
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: url,
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["th", "en", "zh"]).default("th"),
  NEXT_PUBLIC_SUPPORTED_LOCALES: localeList,
  NEXT_PUBLIC_GTM_ID: z.preprocess(emptyToUndefined, z.string().regex(/^GTM-[A-Z0-9]+$/).optional()),
  NEXT_PUBLIC_GA4_ID: z.preprocess(emptyToUndefined, z.string().regex(/^G-[A-Z0-9]+$/).optional()),
});

/** Cross-field rules. */
function refine<T extends { NEXT_PUBLIC_DEFAULT_LOCALE: "th" | "en" | "zh"; NEXT_PUBLIC_SUPPORTED_LOCALES: string[] }>(
  e: T,
): T {
  if (!e.NEXT_PUBLIC_SUPPORTED_LOCALES.includes(e.NEXT_PUBLIC_DEFAULT_LOCALE)) {
    throw new Error(
      `NEXT_PUBLIC_DEFAULT_LOCALE (${e.NEXT_PUBLIC_DEFAULT_LOCALE}) must be in NEXT_PUBLIC_SUPPORTED_LOCALES`,
    );
  }
  return e;
}

// Use globalThis so this compiles in non-DOM contexts too (the worker tsconfig has no "dom" lib).
const isServer = typeof (globalThis as { window?: unknown }).window === "undefined";

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
}

function parseClient() {
  const parsed = clientSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`❌ Invalid client env (NEXT_PUBLIC_*):\n${format(parsed.error)}`);
  }
  return parsed.data;
}

function parseServer() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`❌ Invalid server env:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

/** Client-safe env — importable anywhere. */
export const clientEnv = refine(parseClient());

/**
 * Full server env. Throws if accessed in the browser (guards against leaking secrets).
 */
export const env = (() => {
  if (!isServer) {
    return new Proxy({} as ReturnType<typeof parseServer> & typeof clientEnv, {
      get(_t, prop) {
        if (typeof prop === "string" && prop.startsWith("NEXT_PUBLIC_")) {
          return (clientEnv as Record<string, unknown>)[prop];
        }
        throw new Error(`❌ Attempted to access server env "${String(prop)}" in the browser.`);
      },
    });
  }
  return { ...parseServer(), ...clientEnv };
})();

export type ServerEnv = z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
