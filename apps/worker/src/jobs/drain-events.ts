// apps/worker/src/jobs/drain-events.ts
// Drain the Redis tracking-event buffer into Postgres in batches. หอมฉลุย — Powered by 2T9COME.
// Idempotency: events carry their own data; we insert in batches. Runs frequently (e.g. every
// 30s) so the buffer never grows unbounded under 1k rps (see docs/SCALABILITY.md).
import { db } from "@homchalui/db";
import { drainEvents } from "@homchalui/redis";

type RawEvent = Record<string, unknown>;

const LOCALES = ["th", "en", "zh"] as const;
type Loc = (typeof LOCALES)[number];

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function mapEvent(e: RawEvent) {
  const rawLocale = str(e.locale);
  const event = str(e.event);
  if (!event || rawLocale === null || !LOCALES.includes(rawLocale as Loc)) return null;
  const locale = rawLocale as Loc;
  return {
    event,
    locale,
    productId: str(e.product_id) ?? undefined,
    merchantId: str(e.merchant_id) ?? undefined,
    sessionId: str(e.session_id) ?? "anon",
    userId: str(e.user_id) ?? undefined,
    device: str(e.device) ?? undefined,
    source: str(e.source) ?? undefined,
    medium: str(e.medium) ?? undefined,
    campaign: str(e.campaign) ?? undefined,
    pageUrl: str(e.page_url) ?? "/",
    referrer: str(e.referrer) ?? undefined,
    payload: e as object,
    createdAt: str(e.timestamp) ? new Date(str(e.timestamp) as string) : new Date(),
  };
}

export async function drainEventsJob(): Promise<{ inserted: number }> {
  let inserted = 0;
  // Pull until the buffer is empty (bounded loop to avoid starving other jobs).
  for (let i = 0; i < 50; i++) {
    const batch = await drainEvents(500);
    if (batch.length === 0) break;
    const rows = batch.map(mapEvent).filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length) {
      await db.trackingEvent.createMany({ data: rows });
      inserted += rows.length;
    }
  }
  return { inserted };
}
