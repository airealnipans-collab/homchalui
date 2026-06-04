// packages/redis/src/counter.ts
// Write-absorbing counters + unique-clicker estimation + event buffer. Powered by 2T9COME.
// Counters are flushed to Postgres *_stats by the worker, then expire. Best-effort: a failed
// increment must NEVER block the outbound redirect or the tracking response.
import { redis, KEY } from "./client";

/** Current hour bucket, e.g. "2026-06-03T10". Used to group counters per hour. */
export function hourBucket(d = new Date()): string {
  return d.toISOString().slice(0, 13);
}
export function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

const COUNTER_TTL = 6 * 3600; // safety TTL; worker flushes well before this

function markDirty(pipe: ReturnType<ReturnType<typeof redis>["pipeline"]>, bucket: string, productId: string, locale: string) {
  pipe.sadd(KEY.dirty(bucket), `${productId}|${locale}`);
  pipe.expire(KEY.dirty(bucket), COUNTER_TTL);
}

/** Increment outbound-click counter for a product/locale in the current hour bucket. */
export async function incrOutbound(productId: string, locale: string, by = 1): Promise<void> {
  try {
    const bucket = hourBucket();
    const key = KEY.outboundCounter(productId, locale, bucket);
    const pipe = redis().pipeline();
    pipe.incrby(key, by);
    pipe.expire(key, COUNTER_TTL);
    markDirty(pipe, bucket, productId, locale);
    await pipe.exec();
  } catch {
    /* best-effort */
  }
}

export async function incrView(productId: string, locale: string, by = 1): Promise<void> {
  try {
    const bucket = hourBucket();
    const key = KEY.viewCounter(productId, locale, bucket);
    const pipe = redis().pipeline();
    pipe.incrby(key, by);
    pipe.expire(key, COUNTER_TTL);
    markDirty(pipe, bucket, productId, locale);
    await pipe.exec();
  } catch {
    /* best-effort */
  }
}

/** Increment product-detail view counter (used by trending). */
export async function incrDetail(productId: string, locale: string, by = 1): Promise<void> {
  try {
    const bucket = hourBucket();
    const key = KEY.detailCounter(productId, locale, bucket);
    const pipe = redis().pipeline();
    pipe.incrby(key, by);
    pipe.expire(key, COUNTER_TTL);
    markDirty(pipe, bucket, productId, locale);
    await pipe.exec();
  } catch {
    /* best-effort */
  }
}

export interface DirtyEntry {
  productId: string;
  locale: string;
}

/** Worker side: read & clear the dirty set for a bucket, returning the touched (product,locale) pairs. */
export async function takeDirty(bucket: string): Promise<DirtyEntry[]> {
  try {
    const members = await redis().smembers(KEY.dirty(bucket));
    if (members.length) await redis().del(KEY.dirty(bucket));
    return members
      .map((m) => {
        const [productId, locale] = m.split("|");
        return productId && locale ? { productId, locale } : null;
      })
      .filter((x): x is DirtyEntry => x !== null);
  } catch {
    return [];
  }
}

/** Count a unique clicker per merchant/locale/day via HyperLogLog (tiny memory). */
export async function addUniqueClicker(
  merchantId: string,
  locale: string,
  sessionOrUserId: string,
): Promise<void> {
  try {
    const key = KEY.uniqueClicker(merchantId, locale, dateKey());
    const pipe = redis().pipeline();
    pipe.pfadd(key, sessionOrUserId);
    pipe.expire(key, 2 * 86400);
    await pipe.exec();
  } catch {
    /* best-effort */
  }
}

export async function uniqueClickerCount(merchantId: string, locale: string, date = dateKey()): Promise<number> {
  try {
    return await redis().pfcount(KEY.uniqueClicker(merchantId, locale, date));
  } catch {
    return 0;
  }
}

/**
 * Buffer a tracking event for async batch insertion by the worker.
 * Returns true if enqueued. Caller (API) should still return 204 even on false.
 */
export async function enqueueEvent(event: Record<string, unknown>): Promise<boolean> {
  try {
    await redis().lpush(KEY.eventQueue, JSON.stringify(event));
    return true;
  } catch {
    return false;
  }
}

/** Worker side: pop up to `max` buffered events for batch insert. */
export async function drainEvents(max = 500): Promise<Record<string, unknown>[]> {
  try {
    const pipe = redis().pipeline();
    for (let i = 0; i < max; i++) pipe.rpop(KEY.eventQueue);
    const res = await pipe.exec();
    const out: Record<string, unknown>[] = [];
    for (const [, val] of res ?? []) {
      if (typeof val === "string") out.push(JSON.parse(val));
    }
    return out;
  } catch {
    return [];
  }
}

/** Worker side: read & reset a counter atomically (GETDEL). */
export async function takeCounter(key: string): Promise<number> {
  try {
    const v = await redis().getdel(key);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}
