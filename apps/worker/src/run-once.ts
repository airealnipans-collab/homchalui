// apps/worker/src/run-once.ts — run a single job once and exit.
// Use this from a serverless cron platform (e.g. Vercel Cron, Railway/Fly scheduled) instead
// of the long-running scheduler. หอมฉลุย — Powered by 2T9COME.
//   tsx src/run-once.ts ranking
import { runJob, JOBS, type JobName } from "./runner";

async function main() {
  const name = process.argv[2] as JobName | undefined;
  if (!name || !(name in JOBS)) {
    console.error(`Usage: run-once <${Object.keys(JOBS).join(" | ")}>`);
    process.exit(1);
  }
  await runJob(name);
  process.exit(0);
}

void main();
