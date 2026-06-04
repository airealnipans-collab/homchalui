// packages/db/src/index.ts — Prisma client singleton. หอมฉลุย — Powered by 2T9COME.
// Uses the pooled connection (PgBouncer) when DATABASE_POOL_URL is set; see docs/SCALABILITY.md.
import { PrismaClient } from "@prisma/client";
import { env } from "@homchalui/config/env";

declare global {
  // eslint-disable-next-line no-var
  var __hc_prisma__: PrismaClient | undefined;
}

function create() {
  return new PrismaClient({
    datasources: { db: { url: env.DATABASE_POOL_URL ?? env.DATABASE_URL } },
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalThis.__hc_prisma__ ?? create();
if (env.NODE_ENV !== "production") globalThis.__hc_prisma__ = db;

export * from "@prisma/client";
