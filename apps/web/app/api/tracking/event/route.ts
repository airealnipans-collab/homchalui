// apps/web/app/api/tracking/event/route.ts
// Ingest a tracking event. หอมฉลุย — Powered by 2T9COME.
// Returns 204 in ~1ms: validate (Zod, locale REQUIRED) → enqueue → worker batch-inserts later.
import { NextRequest } from "next/server";
import { trackingEventStrict } from "@homchalui/validators";
import { enqueueEvent, rateLimit } from "@homchalui/redis";
import { env } from "@homchalui/config/env";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

function device(req: NextRequest): "mobile" | "tablet" | "desktop" {
  const ua = req.headers.get("user-agent") ?? "";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export async function POST(req: NextRequest) {
  // Rate limit (fail-open if Redis is down).
  const rl = await rateLimit("track", clientIp(req), env.RATE_LIMIT_TRACK_PER_MIN);
  if (!rl.allowed) return new Response(null, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: { code: "bad_json", message: "Invalid JSON" } }, { status: 400 });
  }

  const parsed = trackingEventStrict.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_event", message: "Validation failed", details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  // Enrich server-side; keep the request fast (no DB write here).
  await enqueueEvent({
    ...parsed.data,
    device: parsed.data.device ?? device(req),
    timestamp: parsed.data.timestamp ?? new Date().toISOString(),
    referrer: parsed.data.referrer ?? req.headers.get("referer") ?? undefined,
  });

  return new Response(null, { status: 204 });
}
