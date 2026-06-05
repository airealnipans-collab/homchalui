// apps/web/lib/admin-layout.ts
// Layout Builder admin service. หอมฉลุย — Powered by 2T9COME.
// Saves a page's sections wholesale (deterministic), audits, and invalidates the front cache.
import { db, Prisma } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import type { Locale } from "@homchalui/i18n";
import type { LayoutUpsert, LayoutSectionUpdate } from "@homchalui/validators";
import { writeAudit } from "./audit";

export interface LayoutEditSection {
  id: string;
  type: string;
  sortOrder: number;
  isActive: boolean;
  config: unknown;
}
export interface LayoutEdit {
  key: string;
  locale: Locale;
  status: "draft" | "published";
  sections: LayoutEditSection[];
}

export async function getLayoutForEdit(key: string, locale: Locale): Promise<LayoutEdit> {
  const page = await db.layoutPage.findUnique({
    where: { key_locale: { key, locale } },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
  if (!page) return { key, locale, status: "draft", sections: [] };
  return {
    key: page.key,
    locale: page.locale,
    status: page.status === "published" ? "published" : "draft",
    sections: page.sections.map((s) => ({ id: s.id, type: s.type, sortOrder: s.sortOrder, isActive: s.isActive, config: s.config })),
  };
}

export async function upsertLayout(input: LayoutUpsert, actorId: string, ip?: string | null): Promise<{ id: string }> {
  const page = await db.layoutPage.upsert({
    where: { key_locale: { key: input.key, locale: input.locale } },
    update: { status: input.status },
    create: { key: input.key, locale: input.locale, status: input.status },
  });
  await db.$transaction([
    db.layoutSection.deleteMany({ where: { layoutPageId: page.id } }),
    db.layoutSection.createMany({
      data: input.sections.map((s, i) => ({
        layoutPageId: page.id,
        type: s.type,
        sortOrder: s.sortOrder ?? i,
        isActive: s.isActive,
        config: s.config as Prisma.InputJsonValue,
      })),
    }),
  ]);
  await writeAudit({ actorId, action: "layout.update", entityType: "layout_page", entityId: page.id, after: input, ip });
  await invalidateTag(`layout:${input.key}:${input.locale}`);
  return { id: page.id };
}

export async function updateSection(id: string, input: LayoutSectionUpdate, actorId: string, ip?: string | null): Promise<boolean> {
  const before = await db.layoutSection.findUnique({ where: { id }, include: { layoutPage: { select: { key: true, locale: true } } } });
  if (!before) return false;
  await db.layoutSection.update({
    where: { id },
    data: {
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      config: input.config === undefined ? undefined : (input.config as Prisma.InputJsonValue),
    },
  });
  await writeAudit({ actorId, action: "layout.section.update", entityType: "layout_section", entityId: id, before, after: input, ip });
  await invalidateTag(`layout:${before.layoutPage.key}:${before.layoutPage.locale}`);
  return true;
}
