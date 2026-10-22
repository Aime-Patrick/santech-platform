-- CreateEnum
CREATE TYPE "CourseMaterialType" AS ENUM ('VIDEO', 'DOCUMENT', 'IMAGE', 'LINK', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "CourseMaterial" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CourseMaterialType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "mimeType" TEXT,
    "durationSec" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseMaterial_courseId_sortOrder_idx" ON "CourseMaterial"("courseId", "sortOrder");
CREATE INDEX "CourseMaterial_lessonId_sortOrder_idx" ON "CourseMaterial"("lessonId", "sortOrder");
CREATE INDEX "CourseMaterial_courseId_isPublished_idx" ON "CourseMaterial"("courseId", "isPublished");
ALTER TABLE "CourseMaterial" ADD CONSTRAINT "CourseMaterial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseMaterial" ADD CONSTRAINT "CourseMaterial_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
