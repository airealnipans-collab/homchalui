// apps/worker/src/jobs/ranking.ts
// Scheduled ranking recompute (trending + best_click + editorial), per locale. Powered by 2T9COME.
// Orchestration lives in @homchalui/ranking (shared with the admin recalculate action) so weights,
// scoring, and snapshot writes stay consistent. Weights come from ranking_configs (admin-tunable).
import { recomputeAll } from "@homchalui/ranking";

export async function rankingJob(): Promise<void> {
  await recomputeAll();
}
