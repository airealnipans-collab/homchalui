-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('th', 'en', 'zh');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('missing', 'draft', 'machine_translated', 'needs_review', 'approved', 'published', 'outdated');

-- CreateEnum
CREATE TYPE "MerchantKey" AS ENUM ('shopee', 'lazada', 'central', 'amazon', 'tiktok', 'official', 'custom');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('active', 'broken', 'disabled');

-- CreateEnum
CREATE TYPE "RankingKey" AS ENUM ('trending', 'best_click', 'editorial', 'personalize');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('idle', 'running', 'ok', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "totp_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "logo_url" TEXT,
    "website_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_translations" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,

    CONSTRAINT "brand_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_translations" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "aeo_summary" TEXT,

    CONSTRAINT "category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "primary_category_id" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "price_min" DECIMAL(12,2),
    "price_max" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "main_image_url" TEXT,
    "manual_boost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manual_pin" BOOLEAN NOT NULL DEFAULT false,
    "exclude_from_ranking" BOOLEAN NOT NULL DEFAULT false,
    "campaign_tag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_translations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "full_description" TEXT,
    "review_summary" TEXT,
    "pros" TEXT[],
    "cons" TEXT[],
    "best_for" TEXT,
    "not_for" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image_url" TEXT,
    "canonical_url" TEXT,
    "aeo_summary" TEXT,
    "faq_items" JSONB,
    "schema_override" JSONB,
    "translation_status" "TranslationStatus" NOT NULL DEFAULT 'draft',
    "translated_by" TEXT,
    "reviewed_by" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text_th" TEXT,
    "alt_text_en" TEXT,
    "alt_text_zh" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_main" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_scent_profiles" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "scent_family" TEXT,
    "mood" TEXT[],
    "season" TEXT[],
    "occasion" TEXT[],
    "gender_target" TEXT,
    "top_notes" TEXT[],
    "middle_notes" TEXT[],
    "base_notes" TEXT[],

    CONSTRAINT "product_scent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_scores" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "scent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longevity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sillage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sweetness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freshness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "luxury" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "beginner_friendly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_cached" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "product_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "key" "MerchantKey" NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "base_domain" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_merchant_links" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "normal_url" TEXT,
    "affiliate_url" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'THB',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "LinkStatus" NOT NULL DEFAULT 'active',
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_merchant_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "product_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reviewer" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "best_for" TEXT,
    "not_for" TEXT,
    "tested" BOOLEAN NOT NULL DEFAULT false,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_review_images" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,

    CONSTRAINT "product_review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "cover_image_url" TEXT,
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_translations" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "aeo_summary" TEXT,
    "faq_items" JSONB,
    "status" "TranslationStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "article_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" TEXT NOT NULL,
    "page_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "canonical_url" TEXT,
    "og_image_url" TEXT,
    "robots" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_overrides" (
    "id" TEXT NOT NULL,
    "page_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "jsonld" JSONB NOT NULL,

    CONSTRAINT "schema_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout_pages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layout_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout_sections" (
    "id" TEXT NOT NULL,
    "layout_page_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "layout_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "product_id" TEXT,
    "merchant_id" TEXT,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "device" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "page_url" TEXT NOT NULL,
    "referrer" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_hourly_stats" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "detail_clicks" INTEGER NOT NULL DEFAULT 0,
    "outbound_clicks" INTEGER NOT NULL DEFAULT 0,
    "wishlist" INTEGER NOT NULL DEFAULT 0,
    "review_engagement" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_hourly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_daily_stats" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "detail_clicks" INTEGER NOT NULL DEFAULT 0,
    "outbound_clicks" INTEGER NOT NULL DEFAULT 0,
    "unique_clickers" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,

    CONSTRAINT "product_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_click_stats" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "date" DATE NOT NULL,
    "outbound_clicks" INTEGER NOT NULL DEFAULT 0,
    "unique_clickers" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "merchant_click_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_query_stats" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "zero_result" BOOLEAN NOT NULL DEFAULT false,
    "date" DATE NOT NULL,

    CONSTRAINT "search_query_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_configs" (
    "id" TEXT NOT NULL,
    "key" "RankingKey" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "weights" JSONB NOT NULL,
    "time_window" TEXT,
    "bounce_penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" TEXT NOT NULL,
    "key" "RankingKey" NOT NULL,
    "locale" "Locale" NOT NULL,
    "product_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_snapshots" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "anchor_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "product_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locales" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "locales_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "translation_jobs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "target_locale" "Locale" NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'draft',
    "requested_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "translation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "from_status" "TranslationStatus" NOT NULL,
    "to_status" "TranslationStatus" NOT NULL,
    "actor_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_jobs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'idle',
    "last_run_at" TIMESTAMP(3),
    "last_error" TEXT,
    "meta" JSONB,

    CONSTRAINT "system_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" INTEGER,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "brand_translations_brand_id_locale_key" ON "brand_translations"("brand_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "brand_translations_locale_slug_key" ON "brand_translations"("locale", "slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_translations_category_id_locale_key" ON "category_translations"("category_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "category_translations_locale_slug_key" ON "category_translations"("locale", "slug");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_primary_category_id_idx" ON "products"("primary_category_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "product_translations_translation_status_idx" ON "product_translations"("translation_status");

-- CreateIndex
CREATE UNIQUE INDEX "product_translations_product_id_locale_key" ON "product_translations"("product_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "product_translations_locale_slug_key" ON "product_translations"("locale", "slug");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_scent_profiles_product_id_key" ON "product_scent_profiles"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_scores_product_id_key" ON "product_scores"("product_id");

-- CreateIndex
CREATE INDEX "product_merchant_links_product_id_idx" ON "product_merchant_links"("product_id");

-- CreateIndex
CREATE INDEX "product_merchant_links_merchant_id_idx" ON "product_merchant_links"("merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_key_key" ON "tags"("key");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_locale_idx" ON "product_reviews"("product_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "article_translations_article_id_locale_key" ON "article_translations"("article_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "article_translations_locale_slug_key" ON "article_translations"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_page_type_entity_id_locale_key" ON "seo_metadata"("page_type", "entity_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "schema_overrides_page_type_entity_id_locale_key" ON "schema_overrides"("page_type", "entity_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "layout_pages_key_locale_key" ON "layout_pages"("key", "locale");

-- CreateIndex
CREATE INDEX "layout_sections_layout_page_id_idx" ON "layout_sections"("layout_page_id");

-- CreateIndex
CREATE INDEX "tracking_events_event_created_at_idx" ON "tracking_events"("event", "created_at");

-- CreateIndex
CREATE INDEX "tracking_events_product_id_locale_created_at_idx" ON "tracking_events"("product_id", "locale", "created_at");

-- CreateIndex
CREATE INDEX "tracking_events_locale_created_at_idx" ON "tracking_events"("locale", "created_at");

-- CreateIndex
CREATE INDEX "product_hourly_stats_locale_calculated_at_idx" ON "product_hourly_stats"("locale", "calculated_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_hourly_stats_product_id_locale_calculated_at_key" ON "product_hourly_stats"("product_id", "locale", "calculated_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_daily_stats_product_id_locale_date_key" ON "product_daily_stats"("product_id", "locale", "date");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_click_stats_merchant_id_locale_date_key" ON "merchant_click_stats"("merchant_id", "locale", "date");

-- CreateIndex
CREATE UNIQUE INDEX "search_query_stats_locale_query_date_key" ON "search_query_stats"("locale", "query", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_configs_key_version_key" ON "ranking_configs"("key", "version");

-- CreateIndex
CREATE INDEX "ranking_snapshots_key_locale_rank_idx" ON "ranking_snapshots"("key", "locale", "rank");

-- CreateIndex
CREATE INDEX "recommendation_snapshots_scope_anchor_id_locale_idx" ON "recommendation_snapshots"("scope", "anchor_id", "locale");

-- CreateIndex
CREATE INDEX "translation_jobs_entity_type_entity_id_idx" ON "translation_jobs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_entity_type_entity_id_idx" ON "admin_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_jobs_name_key" ON "system_jobs"("name");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_translations" ADD CONSTRAINT "brand_translations_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scent_profiles" ADD CONSTRAINT "product_scent_profiles_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scores" ADD CONSTRAINT "product_scores_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_merchant_links" ADD CONSTRAINT "product_merchant_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_merchant_links" ADD CONSTRAINT "product_merchant_links_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_review_images" ADD CONSTRAINT "product_review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layout_sections" ADD CONSTRAINT "layout_sections_layout_page_id_fkey" FOREIGN KEY ("layout_page_id") REFERENCES "layout_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_click_stats" ADD CONSTRAINT "merchant_click_stats_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
