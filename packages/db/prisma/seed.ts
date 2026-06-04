// packages/db/prisma/seed.ts — idempotent seed for หอมฉลุย. Powered by 2T9COME.
// Run: pnpm --filter @homchalui/db seed   (needs DATABASE_URL)
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // ── Locales (Thai = default) ──
  await db.localeConfig.upsert({ where: { code: "th" }, update: {}, create: { code: "th", label: "ไทย", isDefault: true } });
  await db.localeConfig.upsert({ where: { code: "en" }, update: {}, create: { code: "en", label: "English" } });
  await db.localeConfig.upsert({ where: { code: "zh" }, update: {}, create: { code: "zh", label: "中文" } });

  // ── Permissions ──
  const permKeys = [
    "product.create", "product.update", "product.delete", "review.publish", "seo.update",
    "layout.update", "algorithm.update", "translation.update", "analytics.view", "user.manage",
  ];
  const perms = await Promise.all(
    permKeys.map((key) => db.permission.upsert({ where: { key }, update: {}, create: { key } })),
  );

  // ── Roles (Super Admin gets all permissions) ──
  const superAdmin = await db.role.upsert({ where: { name: "Super Admin" }, update: {}, create: { name: "Super Admin" } });
  for (const name of ["Admin", "Editor", "SEO Manager", "Translator", "Analyst", "Viewer"]) {
    await db.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const p of perms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: p.id } },
      update: {},
      create: { roleId: superAdmin.id, permissionId: p.id },
    });
  }

  // ── Admin user (CHANGE the password hash before any real deployment) ──
  const admin = await db.user.upsert({
    where: { email: "admin@homchalui.com" },
    update: {},
    create: {
      email: "admin@homchalui.com",
      name: "Homchalui Admin",
      // TODO: replace with a real argon2/bcrypt hash; this is a dev placeholder.
      passwordHash: "$2a$10$DEV_PLACEHOLDER_CHANGE_ME",
    },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdmin.id },
  });

  // ── Merchants (data-driven; add more anytime) ──
  const merchantDefs = [
    { id: "mch_shopee", key: "shopee" as const, name: "Shopee", baseDomain: "shopee.co.th" },
    { id: "mch_lazada", key: "lazada" as const, name: "Lazada", baseDomain: "lazada.co.th" },
    { id: "mch_central", key: "central" as const, name: "Central", baseDomain: "central.co.th" },
    { id: "mch_amazon", key: "amazon" as const, name: "Amazon", baseDomain: "amazon.com" },
    { id: "mch_tiktok", key: "tiktok" as const, name: "TikTok Shop", baseDomain: "tiktok.com" },
    { id: "mch_official", key: "official" as const, name: "Official Store", baseDomain: null },
  ];
  for (const m of merchantDefs) {
    await db.merchant.upsert({ where: { id: m.id }, update: { name: m.name, baseDomain: m.baseDomain }, create: m });
  }

  // ── Brand + Thai translation ──
  await db.brand.upsert({ where: { id: "brand_lelabe" }, update: {}, create: { id: "brand_lelabe" } });
  await db.brandTranslation.upsert({
    where: { brandId_locale: { brandId: "brand_lelabe", locale: "th" } },
    update: {},
    create: { brandId: "brand_lelabe", locale: "th", name: "Le Labe", slug: "le-labe", description: "แบรนด์น้ำหอมกลิ่นสะอาด" },
  });

  // ── Category + Thai translation ──
  await db.category.upsert({ where: { id: "cat_perfume" }, update: {}, create: { id: "cat_perfume", sortOrder: 1 } });
  await db.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: "cat_perfume", locale: "th" } },
    update: {},
    create: { categoryId: "cat_perfume", locale: "th", name: "น้ำหอม", slug: "perfume", aeoSummary: "รวมรีวิวน้ำหอมทุกกลิ่น" },
  });

  // ── Product (base) ──
  await db.product.upsert({
    where: { id: "prod_demo1" },
    update: {},
    create: {
      id: "prod_demo1",
      brandId: "brand_lelabe",
      primaryCategoryId: "cat_perfume",
      status: "published",
      priceMin: 339,
      priceMax: 369,
      currency: "THB",
      mainImageUrl: "https://cdn.homchalui.com/products/demo1/main.webp",
    },
  });

  // Scores + scent profile (1:1)
  await db.productScore.upsert({
    where: { productId: "prod_demo1" },
    update: {},
    create: {
      productId: "prod_demo1", scent: 8.5, longevity: 7, projection: 6.5, sillage: 6,
      value: 8, sweetness: 4, freshness: 7.5, luxury: 7, beginnerFriendly: 8, overallCached: 7.7,
    },
  });
  await db.productScentProfile.upsert({
    where: { productId: "prod_demo1" },
    update: {},
    create: {
      productId: "prod_demo1", scentFamily: "fresh-floral", mood: ["clean", "calm"],
      season: ["summer", "spring"], occasion: ["daily", "work"], genderTarget: "unisex",
      topNotes: ["bergamot", "mandarin"], middleNotes: ["jasmine", "white tea"], baseNotes: ["white musk", "cedar"],
    },
  });

  // Thai product translation (published)
  await db.productTranslation.upsert({
    where: { productId_locale: { productId: "prod_demo1", locale: "th" } },
    update: {},
    create: {
      productId: "prod_demo1", locale: "th",
      name: "Le Labe Fresh Tea น้ำหอมกลิ่นสะอาด",
      slug: "le-labe-fresh-tea",
      shortDescription: "น้ำหอมกลิ่นสะอาด สดชื่น เหมาะใส่ทุกวัน ราคาเข้าถึงง่าย",
      reviewSummary: "กลิ่นสะอาดสดชื่นแบบ unisex ติดทนปานกลาง คุ้มราคา เหมาะกับมือใหม่และใส่ทำงาน",
      pros: ["กลิ่นสะอาด ใส่ง่าย", "คุ้มราคา", "เหมาะกับมือใหม่"],
      cons: ["การกระจายตัวปานกลาง", "ติดทนไม่นานมากในวันที่ร้อนจัด"],
      bestFor: "คนชอบกลิ่นสะอาด ใส่ทำงาน/ทุกวัน งบไม่เกิน 1,000",
      notFor: "คนชอบกลิ่นหวานจัดหรืออยากได้ projection แรง",
      seoTitle: "รีวิว Le Labe Fresh Tea น้ำหอมกลิ่นสะอาด คุ้มราคา | หอมฉลุย",
      seoDescription: "รีวิว Le Labe Fresh Tea กลิ่นสะอาดสดชื่น ติดทนปานกลาง พร้อมคะแนนและช่องทางซื้อ",
      aeoSummary: "Le Labe Fresh Tea คือน้ำหอม unisex กลิ่นสะอาดสดชื่น ราคาเริ่ม 339-369 บาท ติดทนปานกลาง เหมาะกับมือใหม่และใส่ทำงาน",
      faqItems: [
        { q: "ติดทนกี่ชั่วโมง?", a: "ประมาณ 4-6 ชั่วโมงในสภาพอากาศปกติ" },
        { q: "เหมาะกับผู้ชายหรือผู้หญิง?", a: "เป็นกลิ่น unisex ใส่ได้ทั้งสองเพศ" },
      ],
      translationStatus: "published",
      publishedAt: new Date(),
    },
  });

  // Merchant links (tracked via /go/:id)
  const links = [
    { id: "lnk_1", merchantId: "mch_shopee", affiliateUrl: "https://shopee.co.th/product/demo?aff=homchalui", price: 339, priority: 1 },
    { id: "lnk_2", merchantId: "mch_lazada", affiliateUrl: "https://lazada.co.th/products/demo.html?aff=homchalui", price: 369, priority: 2 },
    { id: "lnk_3", merchantId: "mch_tiktok", affiliateUrl: "https://www.tiktok.com/shop/demo?aff=homchalui", price: 349, priority: 3 },
  ];
  for (const l of links) {
    await db.productMerchantLink.upsert({
      where: { id: l.id },
      update: { affiliateUrl: l.affiliateUrl, price: l.price, priority: l.priority, status: "active" },
      create: { id: l.id, productId: "prod_demo1", merchantId: l.merchantId, affiliateUrl: l.affiliateUrl, price: l.price, priority: l.priority, status: "active", currency: "THB" },
    });
  }

  // Review (published, NOT tested, NOT sponsored)
  await db.productReview.upsert({
    where: { id: "rev_demo1" },
    update: {},
    create: {
      id: "rev_demo1", productId: "prod_demo1", locale: "th",
      title: "กลิ่นสะอาดคุ้มราคา", body: "ใส่ทำงานได้ทั้งวัน กลิ่นไม่ฉุน เหมาะกับมือใหม่มาก",
      reviewer: "ทีมงานหอมฉลุย", rating: 4.3, pros: ["กลิ่นสะอาด", "คุ้มราคา"], cons: ["ติดทนปานกลาง"],
      bestFor: "มือใหม่", notFor: "สายกลิ่นหวานจัด", tested: false, sponsored: false, publishedAt: new Date(),
    },
  });

  // Home layout (Thai) with a couple of sections
  const home = await db.layoutPage.upsert({
    where: { key_locale: { key: "home", locale: "th" } },
    update: { status: "published" },
    create: { key: "home", locale: "th", status: "published" },
  });
  await db.layoutSection.upsert({
    where: { id: "sec_home_hero" },
    update: {},
    create: { id: "sec_home_hero", layoutPageId: home.id, type: "hero", sortOrder: 1, config: { title: "หอมฉลุย", subtitle: "รีวิวของหอมที่ใช่สำหรับคุณ" } },
  });
  await db.layoutSection.upsert({
    where: { id: "sec_home_trending" },
    update: {},
    create: { id: "sec_home_trending", layoutPageId: home.id, type: "product_carousel", sortOrder: 2, config: { title: "น้ำหอมมาแรงวันนี้", source: "trending", limit: 12, category: "perfume", sort: "trending_score" } },
  });

  console.log("✅ Seed complete. Visit /product/le-labe-fresh-tea");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
