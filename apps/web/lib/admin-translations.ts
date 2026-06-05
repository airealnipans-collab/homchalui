// apps/web/lib/admin-translations.ts
// Translation management + lifecycle. หอมฉลุย — Powered by 2T9COME.
// Thai is the source of truth. Lifecycle: draft → needs_review → approved → published (+ outdated).
// "Publish requires approved" is enforced here. Status changes + machine drafts write TranslationLog.
import { db } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import { LOCALES, type Locale } from "@homchalui/i18n";
import type { TranslationEntityType, TranslationStatusValue, settableTranslationStatus } from "@homchalui/validators";
import { z } from "zod";
import { writeAudit } from "./audit";
import { ConflictError } from "./admin-products";

type SettableStatus = z.infer<typeof settableTranslationStatus>;

export interface MatrixCell {
  id: string | null;
  status: TranslationStatusValue;
}
export interface MatrixRow {
  entityType: TranslationEntityType;
  entityId: string;
  name: string;
  statuses: Record<Locale, MatrixCell>;
}
export interface TranslationMatrix {
  rows: MatrixRow[];
  completeness: Record<"en" | "zh", number>;
  shouldTranslateNext: { entityType: TranslationEntityType; entityId: string; name: string; missing: Locale[] }[];
}

function blankStatuses(): Record<Locale, MatrixCell> {
  return { th: { id: null, status: "missing" }, en: { id: null, status: "missing" }, zh: { id: null, status: "missing" } };
}

export async function getTranslationMatrix(): Promise<TranslationMatrix> {
  const [prodTr, artTr] = await Promise.all([
    db.productTranslation.findMany({ select: { id: true, productId: true, locale: true, name: true, translationStatus: true } }),
    db.articleTranslation.findMany({ select: { id: true, articleId: true, locale: true, title: true, status: true } }),
  ]);

  const map = new Map<string, MatrixRow>();
  const key = (t: TranslationEntityType, id: string) => `${t}:${id}`;

  for (const t of prodTr) {
    const k = key("product", t.productId);
    const row = map.get(k) ?? { entityType: "product" as const, entityId: t.productId, name: "", statuses: blankStatuses() };
    row.statuses[t.locale] = { id: t.id, status: t.translationStatus };
    if (t.locale === "th") row.name = t.name;
    if (!row.name) row.name = t.name;
    map.set(k, row);
  }
  for (const t of artTr) {
    const k = key("article", t.articleId);
    const row = map.get(k) ?? { entityType: "article" as const, entityId: t.articleId, name: "", statuses: blankStatuses() };
    row.statuses[t.locale] = { id: t.id, status: t.status };
    if (t.locale === "th") row.name = t.title;
    if (!row.name) row.name = t.title;
    map.set(k, row);
  }

  const rows = [...map.values()];
  // Completeness: among entities whose Thai source is published, how many have this locale published.
  const withThai = rows.filter((r) => r.statuses.th.status === "published");
  const pct = (loc: "en" | "zh") =>
    withThai.length === 0 ? 100 : Math.round((withThai.filter((r) => r.statuses[loc].status === "published").length / withThai.length) * 100);

  const shouldTranslateNext = withThai
    .map((r) => {
      const missing = (["en", "zh"] as Locale[]).filter((l) => ["missing", "outdated"].includes(r.statuses[l].status));
      return { entityType: r.entityType, entityId: r.entityId, name: r.name, missing };
    })
    .filter((x) => x.missing.length > 0);

  return { rows, completeness: { en: pct("en"), zh: pct("zh") }, shouldTranslateNext };
}

export async function setTranslationStatus(
  entityType: TranslationEntityType,
  translationId: string,
  status: SettableStatus,
  actorId: string,
  ip?: string | null,
): Promise<boolean> {
  if (entityType === "product") {
    const before = await db.productTranslation.findUnique({ where: { id: translationId }, select: { translationStatus: true, locale: true, productId: true, slug: true } });
    if (!before) return false;
    if (status === "published" && !["approved", "published"].includes(before.translationStatus)) {
      throw new ConflictError("ต้อง 'approved' ก่อนจึงจะ publish ได้");
    }
    await db.productTranslation.update({
      where: { id: translationId },
      data: { translationStatus: status, publishedAt: status === "published" ? new Date() : null },
    });
    await db.translationLog.create({ data: { entityType: "product", entityId: before.productId, locale: before.locale, fromStatus: before.translationStatus, toStatus: status, actorId } });
    await invalidateTag(`product-slug:${before.locale}:${before.slug}`);
    await invalidateTag(`products:${before.locale}`);
  } else {
    const before = await db.articleTranslation.findUnique({ where: { id: translationId }, select: { status: true, locale: true, articleId: true } });
    if (!before) return false;
    if (status === "published" && !["approved", "published"].includes(before.status)) {
      throw new ConflictError("ต้อง 'approved' ก่อนจึงจะ publish ได้");
    }
    await db.articleTranslation.update({ where: { id: translationId }, data: { status } });
    await db.translationLog.create({ data: { entityType: "article", entityId: before.articleId, locale: before.locale, fromStatus: before.status, toStatus: status, actorId } });
  }

  await writeAudit({ actorId, action: "translation.update", entityType: `translation_${entityType}`, entityId: translationId, after: { status }, ip });
  return true;
}

/** Create a machine-translated draft for a target locale by copying the Thai source (placeholder MT). */
export async function generateDraft(
  entityType: TranslationEntityType,
  entityId: string,
  targetLocale: "en" | "zh",
  actorId: string,
  ip?: string | null,
): Promise<{ id: string }> {
  if (entityType === "product") {
    const th = await db.productTranslation.findUnique({ where: { productId_locale: { productId: entityId, locale: "th" } } });
    if (!th) throw new ConflictError("ยังไม่มีต้นฉบับภาษาไทย");
    const existing = await db.productTranslation.findUnique({ where: { productId_locale: { productId: entityId, locale: targetLocale } }, select: { id: true } });
    if (existing) throw new ConflictError("มีคำแปลภาษานี้อยู่แล้ว");
    const created = await db.productTranslation.create({
      data: {
        productId: entityId, locale: targetLocale, name: `[MT] ${th.name}`, slug: th.slug,
        shortDescription: th.shortDescription, fullDescription: th.fullDescription, reviewSummary: th.reviewSummary,
        pros: th.pros, cons: th.cons, bestFor: th.bestFor, notFor: th.notFor,
        seoTitle: th.seoTitle, seoDescription: th.seoDescription, aeoSummary: th.aeoSummary, faqItems: th.faqItems ?? undefined,
        translationStatus: "machine_translated",
      },
    });
    await db.translationJob.create({ data: { entityType: "product", entityId, targetLocale, status: "machine_translated", requestedBy: actorId, finishedAt: new Date() } });
    await db.translationLog.create({ data: { entityType: "product", entityId, locale: targetLocale, fromStatus: "missing", toStatus: "machine_translated", actorId } });
    await writeAudit({ actorId, action: "translation.generate_draft", entityType: "translation_product", entityId: created.id, after: { targetLocale }, ip });
    return { id: created.id };
  }

  const th = await db.articleTranslation.findUnique({ where: { articleId_locale: { articleId: entityId, locale: "th" } } });
  if (!th) throw new ConflictError("ยังไม่มีต้นฉบับภาษาไทย");
  const existing = await db.articleTranslation.findUnique({ where: { articleId_locale: { articleId: entityId, locale: targetLocale } }, select: { id: true } });
  if (existing) throw new ConflictError("มีคำแปลภาษานี้อยู่แล้ว");
  const created = await db.articleTranslation.create({
    data: {
      articleId: entityId, locale: targetLocale, title: `[MT] ${th.title}`, slug: th.slug,
      excerpt: th.excerpt, content: th.content, seoTitle: th.seoTitle, seoDescription: th.seoDescription,
      aeoSummary: th.aeoSummary, faqItems: th.faqItems ?? undefined, status: "machine_translated",
    },
  });
  await db.translationJob.create({ data: { entityType: "article", entityId, targetLocale, status: "machine_translated", requestedBy: actorId, finishedAt: new Date() } });
  await db.translationLog.create({ data: { entityType: "article", entityId, locale: targetLocale, fromStatus: "missing", toStatus: "machine_translated", actorId } });
  await writeAudit({ actorId, action: "translation.generate_draft", entityType: "translation_article", entityId: created.id, after: { targetLocale }, ip });
  return { id: created.id };
}
