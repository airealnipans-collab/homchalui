// packages/redis/src/cache.ts
// Read-through JSON cache with tag-based invalidation. Powered by 2T9COME.
// Degrades gracefully: if Redis is down, loader() still runs (we just don't cache).
import { redis, redisRead, KEY } from "./client";

type Loader<T> = () => Promise<T>;

/** Get parsed JSON or null. Never throws on Redis failure. */
export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await redisRead().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Set JSON with TTL (seconds) and optional cache tags for grouped invalidation. */
export async function setJson(key: string, value: unknown, ttlSec: number, tags: string[] = []): Promise<void> {
  try {
    const pipe = redis().pipeline();
    pipe.set(key, JSON.stringify(value), "EX", ttlSec);
    for (const tag of tags) {
      pipe.sadd(KEY.tag(tag), key);
      pipe.expire(KEY.tag(tag), ttlSec + 60);
    }
    await pipe.exec();
  } catch {
    /* best-effort cache */
  }
}

/**
 * Read-through cache. Serves from Redis on hit; otherwise runs `loader`, caches, returns.
 * On Redis failure it transparently falls back to `loader` (no cache).
 */
export async function withCache<T>(
  key: string,
  ttlSec: number,
  loader: Loader<T>,
  tags: string[] = [],
): Promise<T> {
  const hit = await getJson<T>(key);
  if (hit !== null) return hit;
  const value = await loader();
  // Don't cache null/undefined as a "value"; let it re-resolve next time.
  if (value !== null && value !== undefined) await setJson(key, value, ttlSec, tags);
  return value;
}

/** Invalidate every key associated with a tag (e.g. on publish: `product:{id}`). */
export async function invalidateTag(tag: string): Promise<void> {
  try {
    const tagKey = KEY.tag(tag);
    const members = await redis().smembers(tagKey);
    const pipe = redis().pipeline();
    for (const k of members) pipe.del(k);
    pipe.del(tagKey);
    await pipe.exec();
  } catch {
    /* best-effort */
  }
}

export async function del(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis().del(...keys);
  } catch {
    /* best-effort */
  }
}
