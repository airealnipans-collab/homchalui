// apps/worker/src/index.ts — long-running scheduler. หอมฉลุย — Powered by 2T9COME.
// Registers cron jobs. Schedules come from env (see .env.example). Each job is wrapped in a
// distributed lock so running multiple worker instances is safe.
import cron from "node-cron";
import { env } from "@homchalui/config/env";
import { runJob } from "./runner";

function schedule(expr: string, name: Parameters<typeof runJob>[0]) {
  if (!cron.validate(expr)) {
    console.error(`[worker] invalid cron "${expr}" for ${name}; skipping`);
    return;
  }
  cron.schedule(expr, () => void runJob(name), { timezone: "Asia/Bangkok" });
  console.log(`[worker] scheduled ${name} @ "${expr}"`);
}

function main() {
  console.log("[worker] starting (Powered by 2T9COME)");

  // High-frequency: drain the event buffer every 30s so it never backs up under peak load.
  schedule("*/30 * * * * *", "drain-events");

  // From env (defaults in .env.example): hourly stats, hourly ranking, daily link check.
  schedule(env.STATS_ROLLUP_CRON, "rollup-stats");
  schedule(env.RANKING_RECALC_CRON, "ranking");
  schedule(env.LINK_CHECK_CRON, "link-check");
  schedule(env.SITEMAP_CRON, "sitemap");

  // Keep the process alive.
  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}

main();
