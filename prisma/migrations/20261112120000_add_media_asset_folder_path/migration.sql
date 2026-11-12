ALTER TABLE "MediaAsset"
ADD COLUMN "folderPath" TEXT NOT NULL DEFAULT '';

CREATE INDEX "MediaAsset_folderPath_createdAt_idx"
ON "MediaAsset"("folderPath", "createdAt");
