// apps/web/app/admin/(panel)/reviews/[id]/page.tsx — review editor page. หอมฉลุย — Powered by 2T9COME.
// `/admin/reviews/new` → create; `/admin/reviews/[id]` → edit. Mutations go through
// /api/admin/reviews (RBAC review.publish + audit + AggregateRating recompute).
import { notFound } from "next/navigation";
import { ReviewEditor } from "@/components/admin/ReviewEditor";
import { getReviewForEdit } from "@/lib/admin-reviews";
import { listProductsAdmin } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export default async function ReviewEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const [productsRaw, initial] = await Promise.all([
    listProductsAdmin(),
    isNew ? Promise.resolve(null) : getReviewForEdit(params.id),
  ]);
  if (!isNew && !initial) notFound();
  const products = productsRaw.map((p) => ({ id: p.id, name: p.name }));

  return <ReviewEditor reviewId={isNew ? undefined : params.id} initial={initial} products={products} />;
}
