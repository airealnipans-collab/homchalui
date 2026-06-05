-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'article';

-- CreateIndex
CREATE INDEX "articles_kind_idx" ON "articles"("kind");
