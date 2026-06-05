// apps/web/lib/admin-reviews.ts
// Backoffice review CRUD service. หอมฉลุย — Powered by 2T9COME.
// Integrity (CLAUDE.md §2.6): reviews are real; `tested`/`sponsored` are explicit flags surfaced
// on the front. Publishing/unpublishing recomputes AggregateRating (we invalidate the product
// cache so getProductBySlug re-derives rating + the review list).
import { db } from "@homchalui/db";
import { invalidateTag } from "@homchalui/redis";
import { LOCALES } from "@homchalui/i18n";
import type { ReviewCreate, ReviewUpdate } from "@homchalui/validators";
import { writeAudit } from "./audit";

async function invalidateForProduct(productId: string): Promise<void> {
  const trs = await db.productTranslation.findMany({ where: { productId }, select: { locale: true, slug: true } });
  const tags = new Set<string>(["home:th"]);
  for (const l of LOCALES) tags.add(`products:${l}`);
  for (const t of trs) tags.add(`product-slug:${t.locale}:${t.slug}`);
  await Promise.all([...tags].map((t) => invalidateTag(t)));
}

export async function createReview(input: ReviewCreate, actorId: string, ip?: string | null): Promise<{ id: string }> {
  const review = await db.productReview.create({
    data: {
      productId: input.productId,
      locale: input.locale,
      title: input.title,
      body: input.body,
      reviewer: input.reviewer ?? null,
      rating: input.rating,
      pros: input.pros,
      cons: input.cons,
      bestFor: input.bestFor ?? null,
      notFor: input.notFor ?? null,
      tested: input.tested,
      sponsored: input.sponsored,
      publishedAt: input.published ? new Date() : null,
    },
  });
  await writeAudit({ actorId, action: "review.create", entityType: "review", entityId: review.id, after: input, ip });
  await invalidateForProduct(input.productId);
  return { id: review.id };
}

export async function updateReview(id: string, input: ReviewUpdate, actorId: string, ip?: string | null): Promise<boolean> {
  const before = await db.productReview.findUnique({ where: { id } });
  if (!before) return false;

  await db.productReview.update({
    where: { id },
    data: {
      title: input.title,
      body: input.body,
      reviewer: input.reviewer === undefined ? undefined : (input.reviewer ?? null),
      rating: input.rating,
      pros: input.pros,
      cons: input.cons,
      bestFor: input.bestFor === undefined ? undefined : (input.bestFor ?? null),
      notFor: input.notFor === undefined ? undefined : (input.notFor ?? null),
      tested: input.tested,
      sponsored: input.sponsored,
      // publish/unpublish only when `published` is explicitly provided.
      publishedAt: input.published === undefined ? undefined : input.published ? new Date() : null,
    },
  });
  await writeAudit({ actorId, action: "review.update", entityType: "review", entityId: id, before, after: input, ip });
  await invalidateForProduct(before.productId);
  return true;
}

export async function listReviewsAdmin(): Promise<
  { id: string; title: string; product: string; locale: string; rating: number; published: boolean; tested: boolean; sponsored: boolean }[]
> {
  const rows = await db.productReview.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true, title: true, locale: true, rating: true, publishedAt: true, tested: true, sponsored: true,
      product: { select: { translations: { where: { locale: "th" }, select: { name: true } } } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    product: r.product.translations[0]?.name ?? "(no name)",
    locale: r.locale,
    rating: r.rating,
    published: r.publishedAt != null,
    tested: r.tested,
    sponsored: r.sponsored,
  }));
}

export async function getReviewForEdit(id: string) {
  const r = await db.productReview.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id,
    productId: r.productId,
    locale: r.locale,
    title: r.title,
    body: r.body,
    reviewer: r.reviewer ?? "",
    rating: r.rating,
    pros: r.pros,
    cons: r.cons,
    bestFor: r.bestFor ?? "",
    notFor: r.notFor ?? "",
    tested: r.tested,
    sponsored: r.sponsored,
    published: r.publishedAt != null,
  };
}
