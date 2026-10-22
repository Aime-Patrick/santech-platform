CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');
CREATE TABLE "CourseReview" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "learnerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "body" TEXT NOT NULL,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CourseComment" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "learnerId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseComment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CourseReview_courseId_learnerId_key" ON "CourseReview"("courseId", "learnerId");
CREATE INDEX "CourseReview_courseId_status_idx" ON "CourseReview"("courseId", "status");
CREATE INDEX "CourseComment_courseId_status_createdAt_idx" ON "CourseComment"("courseId", "status", "createdAt");
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseComment" ADD CONSTRAINT "CourseComment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseComment" ADD CONSTRAINT "CourseComment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
