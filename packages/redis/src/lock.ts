// packages/redis/src/lock.ts
// Distributed lock so scheduled jobs (ranking recompute, sitemap, rollup) run once across
// multiple worker instances. Powered by 2T9COME.
import { randomUUID } from "node:crypto";
import { redis, KEY } from "./client";

// Release only if we still own the lock (token match) — atomic.
const RELEASE_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
`;

/** Try to acquire a lock. Returns a release() fn if acquired, otherwise null. */
export async function acquireLock(
  name: string,
  ttlMs = 60_000,
): Promise<null | (() => Promise<void>)> {
  const token = randomUUID();
  const key = KEY.lock(name);
  try {
    const ok = await redis().set(key, token, "PX", ttlMs, "NX");
    if (ok !== "OK") return null;
    return async () => {
      try {
        await redis().eval(RELEASE_LUA, 1, key, token);
      } catch {
        /* lock will expire via TTL */
      }
    };
  } catch {
    return null;
  }
}

/** Run `fn` only if the lock is acquired; otherwise skip (returns false). */
export async function withLock(name: string, ttlMs: number, fn: () => Promise<void>): Promise<boolean> {
  const release = await acquireLock(name, ttlMs);
  if (!release) return false;
  try {
    await fn();
    return true;
  } finally {
    await release();
  }
}
