// apps/web/app/(site)/page.tsx — Thai home (default, no prefix). หอมฉลุย — Powered by 2T9COME.
// Minimal bootable home. Real version is driven by the Layout Builder (LayoutSectionRenderer);
// see docs/FRONTEND.md + docs/BACKOFFICE.md.
import Link from "next/link";
import { db } from "@homchalui/db";
import { withCache } from "@homchalui/redis";

async function latestProducts() {
  return withCache(
    "cache:home:latest:th",
    120,
    async () => {
      const rows = await db.productTranslation.findMany({
        where: { locale: "th", translationStatus: "published", product: { status: "published" } },
        orderBy: { publishedAt: "desc" },
        take: 12,
        select: {
          name: true,
          slug: true,
          shortDescription: true,
          product: { select: { priceMin: true, currency: true, mainImageUrl: true } },
        },
      });
      return rows.map((r) => ({
        name: r.name,
        slug: r.slug,
        short: r.shortDescription,
        price: r.product.priceMin ? Number(r.product.priceMin) : null,
        image: r.product.mainImageUrl,
      }));
    },
    ["home:th"],
  );
}

export default async function HomePage() {
  const products = await latestProducts();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-3xl bg-[var(--accent-lavender)]/40 p-8">
        <h1 className="text-3xl font-semibold text-[var(--text-brown)]">หอมฉลุย</h1>
        <p className="mt-2 text-[var(--text-charcoal)]/80">
          รีวิว เปรียบเทียบ และเลือกของหอมที่ใช่สำหรับคุณ แล้วกดไปซื้อผ่านร้านที่ต้องการ
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">รีวิวล่าสุด</h2>
        {products.length === 0 ? (
          <p className="text-black/60">ยังไม่มีสินค้า — รัน <code>pnpm db:seed</code> เพื่อเพิ่มข้อมูลตัวอย่าง</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={`/product/${p.slug}`}
                className="rounded-2xl border border-black/5 bg-white p-3 transition hover:shadow-md"
              >
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="mb-2 aspect-square w-full rounded-xl object-cover" />
                )}
                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                {p.price != null && <p className="mt-1 text-sm text-[var(--text-brown)]">฿{p.price.toLocaleString()}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
