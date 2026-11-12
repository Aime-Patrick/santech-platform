CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentPath" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaFolder_path_key" ON "MediaFolder"("path");
CREATE INDEX "MediaFolder_parentPath_name_idx" ON "MediaFolder"("parentPath", "name");
