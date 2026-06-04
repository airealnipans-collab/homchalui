// apps/web/lib/audit.ts
// Admin audit log writer. หอมฉลุย — Powered by 2T9COME.
// EVERY backoffice mutation calls this (BACKOFFICE_SPECS). Best-effort: a failed audit write must
// not break the mutation, but failures are logged for investigation.
import { db, Prisma } from "@homchalui/db";

function json(v: unknown): Prisma.InputJsonValue | undefined {
  if (v === undefined) return undefined;
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

export interface AuditInput {
  actorId?: string | null;
  action: string; // e.g. product.create, product.update, product.delete, merchant_link.update
  entityType: string; // e.g. product, merchant_link
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: json(input.before),
        after: json(input.after),
        ip: input.ip ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write audit log:", e);
  }
}
