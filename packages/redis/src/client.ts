// packages/redis/src/client.ts
// ioredis connections for หอมฉลุย. Powered by 2T9COME.
// Primary for writes; optional replica for reads. Lazy singletons (safe across hot-reload).
import Redis, { type RedisOptions } from "ioredis";
import { env } from "@homchalui/config/env";

const KEY_PREFIX = env.REDIS_KEY_PREFIX; // e.g. "hc:"

const baseOptions: RedisOptions = {
  keyPrefix: KEY_PREFIX,
  maxRetriesPerRequest: 2,
  enableAutoPipelining: true,
  // Fail fast so callers can degrade gracefully instead of hanging the request path.
  connectTimeout: 1000,
  commandTimeout: 1000,
  retryStrategy: (times) => Math.min(times * 100, 2000),
};

declare global {
  // eslint-disable-next-line no-var
  var __hc_redis__: { primary?: Redis; replica?: Redis } | undefined;
}
const g = (globalThis.__hc_redis__ ??= {});

/** Primary connection — use for all writes (and reads if no replica). */
export function redis(): Redis {
  if (!g.primary) {
    g.primary = new Redis(env.REDIS_URL, baseOptions);
    g.primary.on("error", (e) => console.error("[redis:primary]", e.message));
  }
  return g.primary;
}

/** Read connection — replica if configured, otherwise primary. */
export function redisRead(): Redis {
  if (env.REDIS_REPLICA_URL) {
    if (!g.replica) {
      g.replica = new Redis(env.REDIS_REPLICA_URL, { ...baseOptions, readOnly: true });
      g.replica.on("error", (e) => console.error("[redis:replica]", e.message));
    }
    return g.replica;
  }
  return redis();
}

export const KEY = {
  prefix: KEY_PREFIX,
  productCache: (id: string, locale: string) => `cache:product:${id}:${locale}`,
  categoryCache: (slug: string, locale: string, filtersHash: string) =>
    `cache:cat:${slug}:${locale}:${filtersHash}`,
  searchCache: (q: string, locale: string) => `cache:search:${locale}:${q}`,
  rank: (key: string, locale: string) => `rank:${key}:${locale}`,
  reco: (scope: string, anchor: string, locale: string) => `reco:${scope}:${anchor}:${locale}`,
  tag: (tag: string) => `cache:tag:${tag}`,
  outboundCounter: (productId: string, locale: string, bucket: string) =>
    `cnt:outbound:${productId}:${locale}:${bucket}`,
  viewCounter: (productId: string, locale: string, bucket: string) =>
    `cnt:view:${productId}:${locale}:${bucket}`,
  detailCounter: (productId: string, locale: string, bucket: string) =>
    `cnt:detail:${productId}:${locale}:${bucket}`,
  // Set of "${productId}|${locale}" touched in a given hour bucket — lets the worker flush
  // exactly the counters that changed, with no SCAN.
  dirty: (bucket: string) => `cnt:dirty:${bucket}`,
  uniqueClicker: (merchantId: string, locale: string, date: string) =>
    `hll:unique:${merchantId}:${locale}:${date}`,
  eventQueue: "q:events",
  rateLimit: (scope: string, id: string) => `rl:${scope}:${id}`,
  lock: (name: string) => `lock:${name}`,
  session: (id: string) => `sess:${id}`,
} as const;
