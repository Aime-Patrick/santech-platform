-- CreateTable
CREATE TABLE "CmsEntry" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceDocumentId" TEXT,
    "slug" TEXT,
    "title" TEXT,
    "status" TEXT,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CmsEntry_contentType_slug_idx" ON "CmsEntry"("contentType", "slug");

-- CreateIndex
CREATE INDEX "CmsEntry_contentType_status_idx" ON "CmsEntry"("contentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CmsEntry_contentType_sourceDocumentId_key" ON "CmsEntry"("contentType", "sourceDocumentId");
