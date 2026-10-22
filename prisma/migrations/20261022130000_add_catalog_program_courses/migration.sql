-- CreateTable
CREATE TABLE "CatalogProgramCourse" (
    "programId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogProgramCourse_pkey" PRIMARY KEY ("programId","courseId")
);
CREATE INDEX "CatalogProgramCourse_programId_sortOrder_idx" ON "CatalogProgramCourse"("programId", "sortOrder");
CREATE INDEX "CatalogProgramCourse_courseId_idx" ON "CatalogProgramCourse"("courseId");
ALTER TABLE "CatalogProgramCourse" ADD CONSTRAINT "CatalogProgramCourse_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogProgramCourse" ADD CONSTRAINT "CatalogProgramCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
