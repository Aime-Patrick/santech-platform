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
async function retry(operation, label) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable = ["P2028", "P1001", "P1017"].includes(error?.code);
      if (!retryable || attempt === 3) throw error;
      console.warn(`Retrying ${label} after ${error.code} (attempt ${attempt + 2}/4)`);
      await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    }
  }
  throw lastError;
}
try {
  // Use short, idempotent writes instead of one long transaction. Production
  // database proxies can close long transactions; rerunning is safe because
  // every record is matched by its Strapi source identifier.
  const mediaBySourceId = new Map();
  for (const file of report.media) {
      const publicId = mediaPublicId(file);
      const existing = await retry(() => prisma.mediaAsset.findFirst({ where: { sourceId: String(file.id) } }), `media lookup ${file.id}`);
      const data = {
        sourceId: String(file.id), sourceDocumentId: file.document_id ?? null, provider: file.provider ?? "cloudinary",
        publicId, url: file.url, alternativeText: file.alternative_text ?? null,
        format: file.ext ? String(file.ext).replace(/^\./, "") : null, width: file.width ?? null, height: file.height ?? null,
      };
      const asset = existing
        ? await retry(() => prisma.mediaAsset.update({ where: { id: existing.id }, data }), `media update ${file.id}`)
        : await retry(() => prisma.mediaAsset.create({ data }), `media create ${file.id}`);
      mediaBySourceId.set(String(file.id), asset.id);
  }
  const categoryBySourceDocumentId = new Map();
  for (const category of report.categories) {
      const existing = await retry(() => prisma.courseCategory.findFirst({ where: { sourceDocumentId: category.document_id ?? undefined } }), `category lookup ${category.id}`);
      const data = {
        sourceId: String(category.id), sourceDocumentId: category.document_id ?? null, name: category.name,
        slug: category.slug, description: category.description ?? null, sortOrder: category.sort_order ?? 0,
        isActive: category.is_active ?? true, status: status(category.published_at), publishedAt: date(category.published_at),
      };
      const saved = existing
        ? await retry(() => prisma.courseCategory.update({ where: { id: existing.id }, data }), `category update ${category.id}`)
        : await retry(() => prisma.courseCategory.create({ data }), `category create ${category.id}`);
      categoryBySourceDocumentId.set(category.document_id, saved.id);
  }
  const relationByCatalogDocument = new Map(report.categoryRelations.map((relation) => [relation.catalog_document_id, relation.category_document_id]));
  const categoryIdByDocument = new Map([...categoryBySourceDocumentId.entries()]);
  let imported = 0;
  for (const [index, item] of report.catalog.entries()) {
      const categoryDocumentId = relationByCatalogDocument.get(item.document_id);
      const categoryId = categoryDocumentId ? categoryIdByDocument.get(categoryDocumentId) ?? null : null;
      const existing = await retry(() => prisma.catalogItem.findFirst({ where: { sourceDocumentId: item.document_id ?? undefined } }), `catalog lookup ${item.id}`);
      const data = {
        sourceId: String(item.id), sourceDocumentId: item.document_id ?? null, title: item.title, slug: item.slug, description: item.description ?? null,
        category: item.category ?? "Uncategorized", provider: item.provider ?? null, format: item.format ?? null,
        level: item.level ?? null, badge: item.badge ?? null, subtitle: item.subtitle ?? null, instructorLabel: item.instructor ?? null,
        durationLabel: item.duration ?? null, rating: item.rating ?? null, reviewCountLabel: item.review_count ?? null,
        sortOrder: index + 1, status: status(item.published_at), publishedAt: date(item.published_at), categoryId,
      };
      if (existing) await retry(() => prisma.catalogItem.update({ where: { id: existing.id }, data }), `catalog update ${item.id}`);
      else await retry(() => prisma.catalogItem.create({ data }), `catalog create ${item.id}`);
      imported += 1;
  }
  const result = { imported, categories: categoryBySourceDocumentId.size, media: mediaBySourceId.size };
  console.log(JSON.stringify({ ...summary(), result }, null, 2));
} finally { await prisma.$disconnect(); }

async function latestReport() {
  const files = (await fs.readdir(path.resolve("tmp"))).filter((file) => file.startsWith("strapi-dry-run-") && file.endsWith(".json")).sort();
  if (!files.length) throw new Error("No dry-run report found. Run npm run migration:dry-run first.");
  return path.join("tmp", files.at(-1));
}
