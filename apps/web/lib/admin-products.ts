// apps/web/lib/admin-products.ts
// Backoffice product CRUD service. หอมฉลุย — Powered by 2T9COME.
// Transactional create/update/archive with per-locale translations, audit logging, and cache
// invalidation. Unique (locale, slug) + price_min ≤ price_max are validated upstream (Zod) and a
// DB unique violation surfaces as ConflictError → 409.
import { db, Prisma } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import type { ProductCreate, ProductUpdate, ProductTranslationInput } from "@homchalui/validators";
import { LOCALES } from "@homchalui/i18n";
import { writeAudit } from "./audit";

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

function translationData(productId: string, t: ProductTranslationInput): Prisma.ProductTranslationUncheckedCreateInput {
  const published = t.translationStatus === "published";
  return {
    productId,
    locale: t.locale,
    name: t.name,
    slug: t.slug,
    shortDescription: t.shortDescription,
    fullDescription: t.fullDescription,
    reviewSummary: t.reviewSummary,
    pros: t.pros,
    cons: t.cons,
    bestFor: t.bestFor,
    notFor: t.notFor,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    ogImageUrl: t.ogImageUrl,
    canonicalUrl: t.canonicalUrl,
    aeoSummary: t.aeoSummary,
    faqItems: t.faqItems ? (t.faqItems as Prisma.InputJsonValue) : Prisma.JsonNull,
    translationStatus: t.translationStatus,
    publishedAt: published ? new Date() : null,
  };
}

async function invalidate(translations: { locale: string; slug: string }[]): Promise<void> {
  const tags = new Set<string>();
  for (const l of LOCALES) tags.add(`products:${l}`);
  tags.add("home:th");
  for (const t of translations) tags.add(`product-slug:${t.locale}:${t.slug}`);
  await Promise.all([...tags].map((t) => invalidateTag(t)));
}

function isUniqueViolation(e: unknown): boolean {
  // Duck-type the code rather than `instanceof` — across Next's bundled module boundaries the
  // PrismaClientKnownRequestError class identity can differ, so instanceof is unreliable here.
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === "P2002";
}

export async function createProduct(input: ProductCreate, actorId: string, ip?: string | null): Promise<{ id: string }> {
  try {
    const product = await db.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          brandId: input.brandId,
          primaryCategoryId: input.primaryCategoryId,
          status: input.status,
          priceMin: input.priceMin ?? null,
          priceMax: input.priceMax ?? null,
          currency: input.currency,
          mainImageUrl: input.mainImageUrl ?? null,
          manualBoost: input.manualBoost,
          manualPin: input.manualPin,
          excludeFromRanking: input.excludeFromRanking,
          campaignTag: input.campaignTag ?? null,
        },
      });
      if (input.scores) await tx.productScore.create({ data: { productId: p.id, ...input.scores } });
      if (input.scentProfile) await tx.productScentProfile.create({ data: { productId: p.id, ...input.scentProfile } });
      for (const t of input.translations) await tx.productTranslation.create({ data: translationData(p.id, t) });
      return p;
    });

    await writeAudit({ actorId, action: "product.create", entityType: "product", entityId: product.id, after: input, ip });
    await invalidate(input.translations);
    return { id: product.id };
  } catch (e) {
    if (isUniqueViolation(e)) throw new ConflictError("A product translation with that (locale, slug) already exists");
    throw e;
  }
}

export async function updateProduct(id: string, input: ProductUpdate, actorId: string, ip?: string | null): Promise<boolean> {
  const before = await db.product.findUnique({ where: { id }, include: { translations: true, scores: true, scentProfile: true } });
  if (!before) return false;

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          brandId: input.brandId,
          primaryCategoryId: input.primaryCategoryId,
          status: input.status,
          priceMin: input.priceMin === undefined ? undefined : input.priceMin,
          priceMax: input.priceMax === undefined ? undefined : input.priceMax,
          currency: input.currency,
          mainImageUrl: input.mainImageUrl === undefined ? undefined : input.mainImageUrl,
          manualBoost: input.manualBoost,
          manualPin: input.manualPin,
          excludeFromRanking: input.excludeFromRanking,
          campaignTag: input.campaignTag === undefined ? undefined : input.campaignTag,
        },
      });
      if (input.scores) {
        await tx.productScore.upsert({ where: { productId: id }, create: { productId: id, ...input.scores }, update: input.scores });
      }
      if (input.scentProfile) {
        await tx.productScentProfile.upsert({ where: { productId: id }, create: { productId: id, ...input.scentProfile }, update: input.scentProfile });
      }
      for (const t of input.translations ?? []) {
        const data = translationData(id, t);
        await tx.productTranslation.upsert({ where: { productId_locale: { productId: id, locale: t.locale } }, create: data, update: data });
      }
    });

    await writeAudit({ actorId, action: "product.update", entityType: "product", entityId: id, before, after: input, ip });
    const touched = [
      ...before.translations.map((t) => ({ locale: t.locale, slug: t.slug })),
      ...(input.translations ?? []).map((t) => ({ locale: t.locale, slug: t.slug })),
    ];
    await invalidate(touched);
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) throw new ConflictError("A product translation with that (locale, slug) already exists");
    throw e;
  }
}

/** Soft delete: status → archived (API_CONTRACTS DELETE → 204). */
export async function archiveProduct(id: string, actorId: string, ip?: string | null): Promise<boolean> {
  const before = await db.product.findUnique({ where: { id }, include: { translations: { select: { locale: true, slug: true } } } });
  if (!before) return false;
  await db.product.update({ where: { id }, data: { status: "archived" } });
  await writeAudit({ actorId, action: "product.delete", entityType: "product", entityId: id, before, after: { status: "archived" }, ip });
  await invalidate(before.translations);
  return true;
}

/** Load a product in the editor's shape (Decimals → numbers). Null if not found. */
export async function getProductForEdit(id: string) {
  const p = await db.product.findUnique({
    where: { id },
    include: { scores: true, scentProfile: true, translations: { orderBy: { locale: "asc" } } },
  });
  if (!p) return null;
  const num = (d: Prisma.Decimal | null) => (d == null ? null : Number(d));
  return {
    id: p.id,
    brandId: p.brandId,
    primaryCategoryId: p.primaryCategoryId,
    status: p.status,
    priceMin: num(p.priceMin),
    priceMax: num(p.priceMax),
    currency: p.currency,
    mainImageUrl: p.mainImageUrl,
    manualBoost: p.manualBoost,
    manualPin: p.manualPin,
    excludeFromRanking: p.excludeFromRanking,
    campaignTag: p.campaignTag,
    scores: p.scores
      ? {
          scent: p.scores.scent, longevity: p.scores.longevity, projection: p.scores.projection,
          sillage: p.scores.sillage, value: p.scores.value, sweetness: p.scores.sweetness,
          freshness: p.scores.freshness, luxury: p.scores.luxury, beginnerFriendly: p.scores.beginnerFriendly,
        }
      : null,
    scentProfile: p.scentProfile
      ? {
          scentFamily: p.scentProfile.scentFamily, genderTarget: p.scentProfile.genderTarget,
          mood: p.scentProfile.mood, season: p.scentProfile.season, occasion: p.scentProfile.occasion,
          topNotes: p.scentProfile.topNotes, middleNotes: p.scentProfile.middleNotes, baseNotes: p.scentProfile.baseNotes,
        }
      : null,
    translations: p.translations.map((t) => {
      const editable = ["draft", "needs_review", "approved", "published"] as const;
      const status = (editable as readonly string[]).includes(t.translationStatus) ? t.translationStatus : "draft";
      return {
        locale: t.locale,
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription ?? "",
        reviewSummary: t.reviewSummary ?? "",
        seoTitle: t.seoTitle ?? "",
        seoDescription: t.seoDescription ?? "",
        aeoSummary: t.aeoSummary ?? "",
        translationStatus: status as "draft" | "needs_review" | "approved" | "published",
      };
    }),
  };
}

export async function brandOptions(): Promise<{ id: string; name: string }[]> {
  const rows = await db.brandTranslation.findMany({ where: { locale: "th" }, select: { brandId: true, name: true }, orderBy: { name: "asc" } });
  return rows.map((r) => ({ id: r.brandId, name: r.name }));
}

export async function categoryOptions(): Promise<{ id: string; name: string }[]> {
  const rows = await db.categoryTranslation.findMany({ where: { locale: "th" }, select: { categoryId: true, name: true }, orderBy: { name: "asc" } });
  return rows.map((r) => ({ id: r.categoryId, name: r.name }));
}

export async function listProductsAdmin(): Promise<
  { id: string; status: string; name: string; brand: string | null; locales: string[]; merchantLinks: number }[]
> {
  const rows = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      translations: { select: { locale: true, name: true } },
      brand: { select: { translations: { where: { locale: "th" }, select: { name: true } } } },
      _count: { select: { merchantLinks: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    status: p.status,
    name: p.translations.find((t) => t.locale === "th")?.name ?? p.translations[0]?.name ?? "(no name)",
    brand: p.brand.translations[0]?.name ?? null,
    locales: p.translations.map((t) => t.locale),
    merchantLinks: p._count.merchantLinks,
  }));
}
