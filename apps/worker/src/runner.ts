// apps/worker/src/runner.ts
// Job runner: distributed lock + system_jobs status tracking. หอมฉลุย — Powered by 2T9COME.
import { db } from "@homchalui/db";
import { withLock } from "@homchalui/redis";
import { drainEventsJob } from "./jobs/drain-events";
import { rollupStatsJob } from "./jobs/rollup-stats";
import { rankingJob } from "./jobs/ranking";
import { linkCheckJob } from "./jobs/link-check";
import { sitemapJob } from "./jobs/sitemap";

export const JOBS = {
  "drain-events": { fn: drainEventsJob, lockTtlMs: 60_000 },
  "rollup-stats": { fn: rollupStatsJob, lockTtlMs: 5 * 60_000 },
  ranking: { fn: rankingJob, lockTtlMs: 5 * 60_000 },
  "link-check": { fn: linkCheckJob, lockTtlMs: 20 * 60_000 },
  sitemap: { fn: sitemapJob, lockTtlMs: 5 * 60_000 },
} as const;

export type JobName = keyof typeof JOBS;

async function setStatus(name: string, status: "running" | "ok" | "failed", error?: string) {
  await db.systemJob
    .upsert({
      where: { name },
      update: { status, lastRunAt: new Date(), lastError: error ?? null },
      create: { name, status, lastRunAt: new Date(), lastError: error ?? null },
    })
    .catch(() => {});
}

/** Run a job once: acquire lock (skip if held), track status, never throw to the caller. */
export async function runJob(name: JobName): Promise<void> {
  const job = JOBS[name];
  const ran = await withLock(`job:${name}`, job.lockTtlMs, async () => {
    await setStatus(name, "running");
    try {
      await job.fn();
      await setStatus(name, "ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[job:${name}] failed:`, msg);
      await setStatus(name, "failed", msg);
    }
  });
  if (!ran) console.log(`[job:${name}] skipped (lock held by another instance)`);
}
