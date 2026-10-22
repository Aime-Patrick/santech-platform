-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "sourceDocumentId" TEXT,
ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceDocumentId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alternativeText" TEXT,
    "format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCategory" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceDocumentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSkill" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceDocumentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTool" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceDocumentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "iconName" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceDocumentId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT,
    "format" TEXT,
    "level" TEXT,
    "badge" TEXT,
    "subtitle" TEXT,
    "instructorLabel" TEXT,
    "durationLabel" TEXT,
    "durationMin" INTEGER,
    "durationMax" INTEGER,
    "durationUnit" TEXT,
    "rating" DECIMAL(3,2),
    "reviewCountLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "imageAssetId" TEXT,
    "categoryId" TEXT,
    "courseId" TEXT,
    "stats" JSONB,
    "learningOutcomes" JSONB,
    "details" JSONB,
    "courseSeries" JSONB,
    "courseTestimonials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItemSkill" (
    "catalogItemId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogItemSkill_pkey" PRIMARY KEY ("catalogItemId","skillId")
);

-- CreateTable
CREATE TABLE "CatalogItemTool" (
    "catalogItemId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogItemTool_pkey" PRIMARY KEY ("catalogItemId","toolId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");

-- CreateIndex
CREATE INDEX "MediaAsset_sourceId_idx" ON "MediaAsset"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCategory_slug_key" ON "CourseCategory"("slug");

-- CreateIndex
CREATE INDEX "CourseCategory_status_sortOrder_idx" ON "CourseCategory"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSkill_slug_key" ON "CourseSkill"("slug");

-- CreateIndex
CREATE INDEX "CourseSkill_status_sortOrder_idx" ON "CourseSkill"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTool_slug_key" ON "CourseTool"("slug");

-- CreateIndex
CREATE INDEX "CourseTool_status_sortOrder_idx" ON "CourseTool"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_slug_key" ON "CatalogItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_courseId_key" ON "CatalogItem"("courseId");

-- CreateIndex
CREATE INDEX "CatalogItem_status_sortOrder_idx" ON "CatalogItem"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogItem_categoryId_idx" ON "CatalogItem"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogItemSkill_skillId_sortOrder_idx" ON "CatalogItemSkill"("skillId", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogItemTool_toolId_sortOrder_idx" ON "CatalogItemTool"("toolId", "sortOrder");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemSkill" ADD CONSTRAINT "CatalogItemSkill_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemSkill" ADD CONSTRAINT "CatalogItemSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "CourseSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemTool" ADD CONSTRAINT "CatalogItemTool_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemTool" ADD CONSTRAINT "CatalogItemTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "CourseTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
