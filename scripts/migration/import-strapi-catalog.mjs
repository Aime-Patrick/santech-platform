import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const write = process.argv.includes("--write");
const reportPath = process.argv.find((value) => value.startsWith("--report="))?.slice("--report=".length)
  ?? (await latestReport());
const report = JSON.parse(await fs.readFile(path.resolve(reportPath), "utf8"));

function status(publishedAt) { return publishedAt ? "PUBLISHED" : "DRAFT"; }
function date(value) { return value ? new Date(value) : null; }
function mediaPublicId(file) {
  const metadata = typeof file.provider_metadata === "string" ? JSON.parse(file.provider_metadata) : file.provider_metadata;
  return metadata?.public_id ?? file.hash ?? file.document_id ?? `strapi-file-${file.id}`;
}
function summary() {
  return { categories: report.categories.length, catalogItems: report.catalog.length, media: report.media.length, mode: write ? "write" : "preview" };
}

if (!write) {
  console.log(JSON.stringify({ ...summary(), message: "Preview only. Add --write after reviewing this report to persist records." }, null, 2));
  process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --write mode.");
const prisma = new PrismaClient();
try {
  const result = await prisma.$transaction(async (tx) => {
    const mediaBySourceId = new Map();
    for (const file of report.media) {
      const publicId = mediaPublicId(file);
      const existing = await tx.mediaAsset.findFirst({ where: { sourceId: String(file.id) } });
      const data = {
        sourceId: String(file.id), sourceDocumentId: file.document_id ?? null, provider: file.provider ?? "cloudinary",
        publicId, url: file.url, alternativeText: file.alternative_text ?? null,
        format: file.ext ? String(file.ext).replace(/^\./, "") : null, width: file.width ?? null, height: file.height ?? null,
      };
      const asset = existing ? await tx.mediaAsset.update({ where: { id: existing.id }, data }) : await tx.mediaAsset.create({ data });
      mediaBySourceId.set(String(file.id), asset.id);
    }
    const categoryBySourceDocumentId = new Map();
    for (const category of report.categories) {
      const existing = await tx.courseCategory.findFirst({ where: { sourceDocumentId: category.document_id ?? undefined } });
      const data = {
        sourceId: String(category.id), sourceDocumentId: category.document_id ?? null, name: category.name,
        slug: category.slug, description: category.description ?? null, sortOrder: category.sort_order ?? 0,
        isActive: category.is_active ?? true, status: status(category.published_at), publishedAt: date(category.published_at),
      };
      const saved = existing ? await tx.courseCategory.update({ where: { id: existing.id }, data }) : await tx.courseCategory.create({ data });
      categoryBySourceDocumentId.set(category.document_id, saved.id);
    }
    const relationByCatalogDocument = new Map(report.categoryRelations.map((relation) => [relation.catalog_document_id, relation.category_document_id]));
    const categoryIdByDocument = new Map([...categoryBySourceDocumentId.entries()]);
    let imported = 0;
    for (const [index, item] of report.catalog.entries()) {
      const categoryDocumentId = relationByCatalogDocument.get(item.document_id);
      const categoryId = categoryDocumentId ? categoryIdByDocument.get(categoryDocumentId) ?? null : null;
      const existing = await tx.catalogItem.findFirst({ where: { sourceDocumentId: item.document_id ?? undefined } });
      const data = {
        sourceId: String(item.id), sourceDocumentId: item.document_id ?? null, title: item.title, slug: item.slug, description: item.description ?? null,
        category: item.category ?? "Uncategorized", provider: item.provider ?? null, format: item.format ?? null,
        level: item.level ?? null, badge: item.badge ?? null, subtitle: item.subtitle ?? null, instructorLabel: item.instructor ?? null,
        durationLabel: item.duration ?? null, rating: item.rating ?? null, reviewCountLabel: item.review_count ?? null,
        sortOrder: index + 1, status: status(item.published_at), publishedAt: date(item.published_at), categoryId,
      };
      if (existing) await tx.catalogItem.update({ where: { id: existing.id }, data });
      else await tx.catalogItem.create({ data });
      imported += 1;
    }
    return { imported, categories: categoryBySourceDocumentId.size, media: mediaBySourceId.size };
  });
  console.log(JSON.stringify({ ...summary(), result }, null, 2));
} finally { await prisma.$disconnect(); }

async function latestReport() {
  const files = (await fs.readdir(path.resolve("tmp"))).filter((file) => file.startsWith("strapi-dry-run-") && file.endsWith(".json")).sort();
  if (!files.length) throw new Error("No dry-run report found. Run npm run migration:dry-run first.");
  return path.join("tmp", files.at(-1));
}