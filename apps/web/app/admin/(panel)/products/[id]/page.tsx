// apps/web/app/admin/(panel)/products/[id]/page.tsx — product editor page. หอมฉลุย — Powered by 2T9COME.
// `/admin/products/new` → create; `/admin/products/[id]` → edit (loads existing). Loads brand +
// category options for the form. The actual mutation goes through /api/admin/products (RBAC + audit).
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getProductForEdit, brandOptions, categoryOptions } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const [brands, categories, initial] = await Promise.all([
    brandOptions(),
    categoryOptions(),
    isNew ? Promise.resolve(null) : getProductForEdit(params.id),
  ]);
  if (!isNew && !initial) notFound();

  return (
    <ProductEditor
      productId={isNew ? undefined : params.id}
      initial={initial}
      brands={brands}
      categories={categories}
    />
  );
}
