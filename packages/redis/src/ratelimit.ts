// packages/redis/src/ratelimit.ts
// Sliding-window rate limiter (atomic Lua). Powered by 2T9COME.
// FAIL-OPEN: if Redis is unavailable we allow the request (with a conservative assumption),
// so an outage degrades performance, not availability. Pair with Cloudflare WAF in front.
import { redis, KEY } from "./client";

// Sliding window using a sorted set of request timestamps.
// KEYS[1]=key  ARGV[1]=now(ms)  ARGV[2]=windowMs  ARGV[3]=limit
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count < limit then
  redis.call('ZADD', key, now, now .. '-' .. math.random())
  redis.call('PEXPIRE', key, window)
  return {1, limit - count - 1}
else
  return {0, 0}
end
`;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * @param scope   logical bucket, e.g. "search" | "track" | "go" | "auth"
 * @param id      client identity, e.g. ip or `${ip}:${userId}`
 * @param limit   max requests per window
 * @param windowMs window length in ms (default 60s)
 */
export async function rateLimit(
  scope: string,
  id: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  try {
    const res = (await redis().eval(
      SLIDING_WINDOW_LUA,
      1,
      KEY.rateLimit(scope, id),
      Date.now().toString(),
      windowMs.toString(),
      limit.toString(),
    )) as [number, number];
    return { allowed: res[0] === 1, remaining: res[1] };
  } catch {
    // Fail open — never block traffic because the limiter is down.
    return { allowed: true, remaining: limit };
  }
}
