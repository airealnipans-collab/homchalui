// apps/web/app/admin/(panel)/ranking/page.tsx — Ranking admin. หอมฉลุย — Powered by 2T9COME.
import { getRankingState } from "@/lib/admin-ranking";
import { RankingAdmin } from "@/components/admin/RankingAdmin";

export const dynamic = "force-dynamic";

export default async function AdminRankingPage() {
  const state = await getRankingState();
  return <RankingAdmin state={state} />;
}
