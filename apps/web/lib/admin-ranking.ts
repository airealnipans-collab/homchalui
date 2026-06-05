// apps/web/lib/admin-ranking.ts
// Ranking admin: config versions, recalculate, preview, rollback. หอมฉลุย — Powered by 2T9COME.
// Recompute/preview reuse @homchalui/ranking (same code the worker runs). algorithm.update gated.
import { db, Prisma } from "@homchalui/db";
import { recomputeRanking, previewRanking, RANK_LOCALES, type RankKey, type RankLocale } from "@homchalui/ranking";
import type { RankingConfigInput } from "@homchalui/validators";
import { writeAudit } from "./audit";

const KEYS: RankKey[] = ["trending", "best_click", "editorial"];

export interface RankingVersion {
  id: string;
  version: number;
  isActive: boolean;
  weights: unknown;
  bouncePenalty: number;
  createdAt: string;
}
export interface RankingKeyState {
  key: RankKey;
  active: RankingVersion | null;
  versions: RankingVersion[];
  lastComputed: Partial<Record<RankLocale, { at: string; count: number }>>;
}

export async function getRankingState(): Promise<RankingKeyState[]> {
  const [configs, snaps] = await Promise.all([
    db.rankingConfig.findMany({ orderBy: { version: "desc" } }),
    db.rankingSnapshot.groupBy({ by: ["key", "locale"], _max: { computedAt: true }, _count: { _all: true } }),
  ]);

  return KEYS.map((key) => {
    const versions = configs
      .filter((c) => c.key === key)
      .map((c) => ({ id: c.id, version: c.version, isActive: c.isActive, weights: c.weights, bouncePenalty: c.bouncePenalty, createdAt: c.createdAt.toISOString() }));
    const lastComputed: RankingKeyState["lastComputed"] = {};
    for (const s of snaps.filter((x) => x.key === key)) {
      if (s._max.computedAt) lastComputed[s.locale as RankLocale] = { at: s._max.computedAt.toISOString(), count: s._count._all };
    }
    return { key, active: versions.find((v) => v.isActive) ?? null, versions, lastComputed };
  });
}

export async function createConfigVersion(input: RankingConfigInput, actorId: string, ip?: string | null): Promise<{ id: string; version: number }> {
  const max = await db.rankingConfig.aggregate({ where: { key: input.key }, _max: { version: true } });
  const version = (max._max.version ?? 0) + 1;

  const created = await db.$transaction(async (tx) => {
    if (input.activate) await tx.rankingConfig.updateMany({ where: { key: input.key, isActive: true }, data: { isActive: false } });
    return tx.rankingConfig.create({
      data: {
        key: input.key,
        version,
        weights: input.weights as Prisma.InputJsonValue,
        timeWindow: input.timeWindow ?? null,
        bouncePenalty: input.bouncePenalty,
        isActive: input.activate,
        createdBy: actorId,
      },
    });
  });
  await writeAudit({ actorId, action: "algorithm.config", entityType: "ranking_config", entityId: created.id, after: input, ip });
  return { id: created.id, version };
}

export async function rollbackConfig(id: string, actorId: string, ip?: string | null): Promise<boolean> {
  const cfg = await db.rankingConfig.findUnique({ where: { id } });
  if (!cfg) return false;
  await db.$transaction([
    db.rankingConfig.updateMany({ where: { key: cfg.key, isActive: true }, data: { isActive: false } }),
    db.rankingConfig.update({ where: { id }, data: { isActive: true } }),
  ]);
  await writeAudit({ actorId, action: "algorithm.rollback", entityType: "ranking_config", entityId: id, after: { key: cfg.key, version: cfg.version }, ip });
  return true;
}

export async function recalculate(key: RankKey, locale: RankLocale | undefined, actorId: string, ip?: string | null): Promise<Record<string, number>> {
  const locales = locale ? [locale] : RANK_LOCALES;
  const result: Record<string, number> = {};
  for (const l of locales) result[l] = await recomputeRanking(key, l);
  await writeAudit({ actorId, action: "algorithm.recalculate", entityType: "ranking", entityId: key, after: { key, locale: locale ?? "all", result }, ip });
  return result;
}

/** Preview the would-be ranking (no write), with product names hydrated. */
export async function preview(key: RankKey, locale: RankLocale, limit = 20): Promise<{ productId: string; name: string; score: number }[]> {
  const scored = await previewRanking(key, locale, limit);
  if (scored.length === 0) return [];
  const trs = await db.productTranslation.findMany({
    where: { productId: { in: scored.map((s) => s.productId) }, locale },
    select: { productId: true, name: true },
  });
  const names = new Map(trs.map((t) => [t.productId, t.name]));
  return scored.map((s) => ({ productId: s.productId, name: names.get(s.productId) ?? s.productId, score: Math.round(s.score * 100) / 100 }));
}
