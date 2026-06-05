// apps/web/lib/admin-seo.ts
// SEO/AEO health report + inline fixes. หอมฉลุย — Powered by 2T9COME.
// Scans published product/article/category translations for missing SEO (title/description/FAQ),
// computes a per-locale health score, and applies inline fixes (auditing + cache invalidation).
import { db } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import type { Locale } from "@homchalui/i18n";
import type { SeoFix } from "@homchalui/validators";
import { writeAudit } from "./audit";

export type SeoMissing = "title" | "description" | "faq";
export interface SeoIssue {
  entityType: "product" | "article" | "category";
  id: string;
  name: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  missing: SeoMissing[];
}
export interface SeoHealth {
  locale: Locale;
  total: number;
  complete: number;
  score: number;
  issues: SeoIssue[];
}

function hasFaq(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

export async function getSeoHealth(locale: Locale): Promise<SeoHealth> {
  const [prods, arts, cats] = await Promise.all([
    db.productTranslation.findMany({
      where: { locale, translationStatus: "published", product: { status: "published" } },
      select: { id: true, name: true, slug: true, seoTitle: true, seoDescription: true, faqItems: true },
    }),
    db.articleTranslation.findMany({
      where: { locale, status: "published", article: { status: "published" } },
      select: { id: true, title: true, slug: true, seoTitle: true, seoDescription: true, faqItems: true },
    }),
    db.categoryTranslation.findMany({
      where: { locale },
      select: { id: true, name: true, slug: true, seoTitle: true, seoDescription: true },
    }),
  ]);

  const issues: SeoIssue[] = [];
  let total = 0;
  let complete = 0;

  function check(
    entityType: SeoIssue["entityType"],
    id: string,
    name: string,
    slug: string,
    seoTitle: string | null,
    seoDescription: string | null,
    faq?: unknown,
  ) {
    total++;
    const missing: SeoMissing[] = [];
    if (!seoTitle) missing.push("title");
    if (!seoDescription) missing.push("description");
    if (faq !== undefined && !hasFaq(faq)) missing.push("faq");
    if (missing.length === 0) complete++;
    else issues.push({ entityType, id, name, slug, seoTitle, seoDescription, missing });
  }

  for (const p of prods) check("product", p.id, p.name, p.slug, p.seoTitle, p.seoDescription, p.faqItems);
  for (const a of arts) check("article", a.id, a.title, a.slug, a.seoTitle, a.seoDescription, a.faqItems);
  for (const c of cats) check("category", c.id, c.name, c.slug, c.seoTitle, c.seoDescription);

  const score = total === 0 ? 100 : Math.round((complete / total) * 100);
  return { locale, total, complete, score, issues };
}

export async function applySeoFix(id: string, input: SeoFix, actorId: string, ip?: string | null): Promise<boolean> {
  const data = { seoTitle: input.seoTitle, seoDescription: input.seoDescription };

  if (input.entityType === "product") {
    const before = await db.productTranslation.findUnique({ where: { id }, select: { locale: true, slug: true } });
    if (!before) return false;
    await db.productTranslation.update({ where: { id }, data });
    await invalidateTag(`product-slug:${before.locale}:${before.slug}`);
  } else if (input.entityType === "article") {
    const before = await db.articleTranslation.findUnique({ where: { id }, select: { id: true } });
    if (!before) return false;
    await db.articleTranslation.update({ where: { id }, data });
  } else {
    const before = await db.categoryTranslation.findUnique({ where: { id }, select: { locale: true, slug: true } });
    if (!before) return false;
    await db.categoryTranslation.update({ where: { id }, data });
    await invalidateTag(`cat:${before.locale}:${before.slug}`);
  }

  await writeAudit({ actorId, action: "seo.update", entityType: `seo_${input.entityType}`, entityId: id, after: input, ip });
  return true;
}
