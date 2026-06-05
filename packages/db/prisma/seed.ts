// packages/db/prisma/seed.ts — idempotent seed for หอมฉลุย. Powered by 2T9COME.
// Run: pnpm --filter @homchalui/db seed   (needs DATABASE_URL)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// DEV ONLY — change SEED_ADMIN_PASSWORD (or this default) before any real deployment.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

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
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await db.user.upsert({
    where: { email: "admin@homchalui.com" },
    update: { passwordHash }, // keep dev login working on re-seed
    create: {
      email: "admin@homchalui.com",
      name: "Homchalui Admin",
      passwordHash,
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
    update: { campaignTag: "best-clean" },
    create: {
      id: "prod_demo1",
      brandId: "brand_lelabe",
      primaryCategoryId: "cat_perfume",
      status: "published",
      priceMin: 339,
      priceMax: 369,
      currency: "THB",
      mainImageUrl: "https://cdn.homchalui.com/products/demo1/main.webp",
      campaignTag: "best-clean",
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

  // ── English + Chinese demo translations (so /en and /zh render real content, no Thai fallback) ──
  await db.brandTranslation.upsert({
    where: { brandId_locale: { brandId: "brand_lelabe", locale: "en" } },
    update: {},
    create: { brandId: "brand_lelabe", locale: "en", name: "Le Labe", slug: "le-labe", description: "A clean-scent fragrance house." },
  });
  await db.brandTranslation.upsert({
    where: { brandId_locale: { brandId: "brand_lelabe", locale: "zh" } },
    update: {},
    create: { brandId: "brand_lelabe", locale: "zh", name: "Le Labe", slug: "le-labe", description: "主打干净香调的香水品牌。" },
  });

  await db.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: "cat_perfume", locale: "en" } },
    update: {},
    create: { categoryId: "cat_perfume", locale: "en", name: "Perfume", slug: "perfume", aeoSummary: "All perfume reviews in one place." },
  });
  await db.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: "cat_perfume", locale: "zh" } },
    update: {},
    create: { categoryId: "cat_perfume", locale: "zh", name: "香水", slug: "perfume", aeoSummary: "汇集所有香水评测。" },
  });

  await db.productTranslation.upsert({
    where: { productId_locale: { productId: "prod_demo1", locale: "en" } },
    update: {},
    create: {
      productId: "prod_demo1", locale: "en",
      name: "Le Labe Fresh Tea — clean scent",
      slug: "le-labe-fresh-tea",
      shortDescription: "A clean, fresh everyday scent at an accessible price.",
      reviewSummary: "A clean, fresh unisex scent with moderate longevity. Great value and beginner-friendly.",
      pros: ["Clean, easy to wear", "Great value", "Beginner-friendly"],
      cons: ["Moderate projection", "Doesn't last long on very hot days"],
      bestFor: "People who like clean scents for daily/office wear under 1,000 THB",
      notFor: "People who want very sweet scents or strong projection",
      seoTitle: "Le Labe Fresh Tea review — a clean, great-value scent | Homchalui",
      seoDescription: "Le Labe Fresh Tea review: clean and fresh, moderate longevity, with scores and where to buy.",
      aeoSummary: "Le Labe Fresh Tea is a clean, fresh unisex perfume from 339–369 THB, moderate longevity, ideal for beginners and office wear.",
      faqItems: [
        { q: "How long does it last?", a: "About 4–6 hours in normal conditions." },
        { q: "Is it for men or women?", a: "It's a unisex scent for everyone." },
      ],
      translationStatus: "published",
      publishedAt: new Date(),
    },
  });
  await db.productTranslation.upsert({
    where: { productId_locale: { productId: "prod_demo1", locale: "zh" } },
    update: {},
    create: {
      productId: "prod_demo1", locale: "zh",
      name: "Le Labe Fresh Tea 清新香调",
      slug: "le-labe-fresh-tea",
      shortDescription: "干净清新的日常香水，价格亲民。",
      reviewSummary: "干净清新的中性香，持久度中等，性价比高，适合新手。",
      pros: ["干净易驾驭", "性价比高", "适合新手"],
      cons: ["扩散度中等", "炎热天气持久度一般"],
      bestFor: "喜欢干净香调、日常/通勤、预算 1000 泰铢以内的人",
      notFor: "喜欢甜腻香或追求强扩散的人",
      seoTitle: "Le Labe Fresh Tea 评测 — 干净高性价比香水 | Homchalui",
      seoDescription: "Le Labe Fresh Tea 评测：干净清新、持久度中等，附评分与购买渠道。",
      aeoSummary: "Le Labe Fresh Tea 是一款干净清新的中性香水，售价 339–369 泰铢，持久度中等，适合新手和通勤。",
      faqItems: [
        { q: "能持续多久？", a: "正常情况下约 4–6 小时。" },
        { q: "适合男性还是女性？", a: "这是一款中性香，男女皆宜。" },
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

  // English review (demo — marked tested to showcase the integrity badge)
  await db.productReview.upsert({
    where: { id: "rev_demo_en" },
    update: {},
    create: {
      id: "rev_demo_en", productId: "prod_demo1", locale: "en",
      title: "Clean and great value", body: "Easy to wear all day at the office; not harsh. Very beginner-friendly.",
      reviewer: "Homchalui team", rating: 4.4, pros: ["Clean scent", "Great value"], cons: ["Moderate longevity"],
      bestFor: "Beginners", notFor: "Lovers of very sweet scents", tested: true, sponsored: false, publishedAt: new Date(),
    },
  });

  // Chinese review (demo)
  await db.productReview.upsert({
    where: { id: "rev_demo_zh" },
    update: {},
    create: {
      id: "rev_demo_zh", productId: "prod_demo1", locale: "zh",
      title: "干净且高性价比", body: "通勤一整天都很好驾驭，不刺鼻，非常适合新手。",
      reviewer: "หอมฉลุย 团队", rating: 4.2, pros: ["干净", "高性价比"], cons: ["持久度中等"],
      bestFor: "新手", notFor: "喜欢甜腻香的人", tested: false, sponsored: false, publishedAt: new Date(),
    },
  });

  // ── Second product (so /compare needs ≥2 and /best lists multiple) ──
  await db.product.upsert({
    where: { id: "prod_demo2" },
    update: { campaignTag: "best-clean" },
    create: {
      id: "prod_demo2", brandId: "brand_lelabe", primaryCategoryId: "cat_perfume", status: "published",
      priceMin: 590, priceMax: 620, currency: "THB", mainImageUrl: "https://cdn.homchalui.com/products/demo2/main.webp",
      campaignTag: "best-clean",
    },
  });
  await db.productScore.upsert({
    where: { productId: "prod_demo2" }, update: {},
    create: { productId: "prod_demo2", scent: 8, longevity: 8.5, projection: 7.5, sillage: 7, value: 7, sweetness: 3, freshness: 6, luxury: 8.5, beginnerFriendly: 6, overallCached: 7.9 },
  });
  await db.productScentProfile.upsert({
    where: { productId: "prod_demo2" }, update: {},
    create: { productId: "prod_demo2", scentFamily: "woody", mood: ["calm", "warm"], season: ["winter"], occasion: ["evening"], genderTarget: "unisex", topNotes: ["bergamot"], middleNotes: ["cedar"], baseNotes: ["sandalwood", "amber"] },
  });
  const p2tr = [
    { locale: "th" as const, name: "Le Labe Cedar Wood กลิ่นไม้", slug: "le-labe-cedar-wood", shortDescription: "กลิ่นไม้อบอุ่น ติดทนนาน เหมาะใส่ตอนเย็น", aeoSummary: "กลิ่นไม้ unisex ติดทนนาน เหมาะใส่ตอนเย็น" },
    { locale: "en" as const, name: "Le Labe Cedar Wood", slug: "le-labe-cedar-wood", shortDescription: "Warm woody scent, long-lasting, great for evenings.", aeoSummary: "Unisex woody scent, long-lasting, great for evenings." },
    { locale: "zh" as const, name: "Le Labe Cedar Wood 木质香", slug: "le-labe-cedar-wood", shortDescription: "温暖木质香，持久，适合晚间。", aeoSummary: "中性木质香，持久，适合晚间。" },
  ];
  for (const t of p2tr) {
    await db.productTranslation.upsert({
      where: { productId_locale: { productId: "prod_demo2", locale: t.locale } },
      update: {},
      create: { productId: "prod_demo2", ...t, pros: [], cons: [], translationStatus: "published", publishedAt: new Date() },
    });
  }
  await db.productMerchantLink.upsert({
    where: { id: "lnk_4" }, update: { affiliateUrl: "https://shopee.co.th/product/demo2?aff=homchalui", price: 590, status: "active" },
    create: { id: "lnk_4", productId: "prod_demo2", merchantId: "mch_shopee", affiliateUrl: "https://shopee.co.th/product/demo2?aff=homchalui", price: 590, priority: 1, status: "active", currency: "THB" },
  });

  // ── Content: a buying guide + an article (th/en/zh, published) ──
  const guide = await db.article.upsert({
    where: { id: "art_guide1" },
    update: { kind: "guide", status: "published" },
    create: { id: "art_guide1", kind: "guide", status: "published", coverImageUrl: "https://cdn.homchalui.com/guide/choose.webp" },
  });
  const guideTr = [
    { locale: "th" as const, title: "วิธีเลือกน้ำหอมให้เหมาะกับคุณ", slug: "how-to-choose-perfume",
      excerpt: "คู่มือเลือกน้ำหอมฉบับมือใหม่ เข้าใจโน้ตกลิ่น ความติดทน และงบประมาณ",
      content: "การเลือกน้ำหอมเริ่มจากเข้าใจกลุ่มกลิ่นที่ชอบ จากนั้นดูความติดทนและการกระจายตัว แล้วจึงเทียบราคาในงบที่ตั้งไว้\n\nมือใหม่ควรเริ่มจากกลิ่นสะอาด/สดชื่นที่ใส่ง่าย",
      aeoSummary: "เลือกน้ำหอม: เริ่มจากกลุ่มกลิ่น → ความติดทน → งบประมาณ → ลองที่ผิวจริง",
      faqItems: [{ q: "งบเท่าไหร่ดี?", a: "เริ่มที่ 300–1,000 บาทสำหรับมือใหม่" }] },
    { locale: "en" as const, title: "How to choose the right perfume", slug: "how-to-choose-perfume",
      excerpt: "A beginner's guide to scent families, longevity and budget.",
      content: "Start from the scent families you like, then weigh longevity and projection, and finally compare prices within your budget.\n\nBeginners should start with easy clean/fresh scents.",
      aeoSummary: "Choosing a perfume: scent family → longevity → budget → test on skin.",
      faqItems: [{ q: "What budget?", a: "300–1,000 THB is a good start for beginners." }] },
    { locale: "zh" as const, title: "如何挑选适合你的香水", slug: "how-to-choose-perfume",
      excerpt: "新手指南：香调家族、持久度与预算。",
      content: "先从你喜欢的香调家族入手，再权衡持久度与扩散度，最后在预算内比较价格。\n\n新手建议从清新干净、易驾驭的香调开始。",
      aeoSummary: "挑选香水：香调家族 → 持久度 → 预算 → 上肤试香。",
      faqItems: [{ q: "预算多少？", a: "新手 300–1,000 泰铢起步即可。" }] },
  ];
  for (const t of guideTr) {
    await db.articleTranslation.upsert({
      where: { articleId_locale: { articleId: guide.id, locale: t.locale } },
      update: {},
      create: { articleId: guide.id, ...t, status: "published" },
    });
  }

  const post = await db.article.upsert({
    where: { id: "art_post1" },
    update: { kind: "article", status: "published" },
    create: { id: "art_post1", kind: "article", status: "published", coverImageUrl: "https://cdn.homchalui.com/article/trends.webp" },
  });
  const postTr = [
    { locale: "th" as const, title: "เทรนด์กลิ่นหอมปีนี้", slug: "scent-trends",
      excerpt: "อัปเดตเทรนด์กลิ่นที่กำลังมาแรง", content: "ปีนี้กลิ่นสะอาดและกลิ่นชาเขียวกำลังได้รับความนิยม...",
      aeoSummary: "เทรนด์ปีนี้: กลิ่นสะอาด ชาเขียว และมัสก์อ่อน ๆ", faqItems: [{ q: "กลิ่นไหนมาแรง?", a: "กลิ่นสะอาดและชาเขียว" }] },
    { locale: "en" as const, title: "This year's scent trends", slug: "scent-trends",
      excerpt: "The fragrance trends taking off right now.", content: "Clean and green-tea scents are trending this year...",
      aeoSummary: "Trends: clean scents, green tea, soft musk.", faqItems: [{ q: "What's hot?", a: "Clean and green-tea scents." }] },
    { locale: "zh" as const, title: "今年的香氛趋势", slug: "scent-trends",
      excerpt: "当下正流行的香氛趋势。", content: "今年干净调与绿茶调正在流行……",
      aeoSummary: "趋势：干净调、绿茶调、柔和麝香。", faqItems: [{ q: "什么最流行？", a: "干净调与绿茶调。" }] },
  ];
  for (const t of postTr) {
    await db.articleTranslation.upsert({
      where: { articleId_locale: { articleId: post.id, locale: t.locale } },
      update: {},
      create: { articleId: post.id, ...t, status: "published" },
    });
  }

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
