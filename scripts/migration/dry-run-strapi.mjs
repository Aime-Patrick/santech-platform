import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const container = process.env.STRAPI_MIGRATION_CONTAINER ?? "santech-cms-migration-pg17";
const database = process.env.STRAPI_MIGRATION_DB ?? "strapi_migration";
const user = process.env.STRAPI_MIGRATION_USER ?? "migration";

function queryJson(sql) {
  const output = execFileSync("docker", ["exec", container, "psql", "-U", user, "-d", database, "-At", "-c", sql], { encoding: "utf8" }).trim();
  return output ? JSON.parse(output) : [];
}

const catalog = queryJson(`select coalesce(json_agg(row_to_json(t)), '[]') from (select id, document_id, title, slug, category, provider, description, format, duration, level, badge, subtitle, instructor, rating, review_count, sort_order, created_at, published_at from (select distinct on (document_id) id, document_id, title, slug, category, provider, description, format, duration, level, badge, subtitle, instructor, rating, review_count, sort_order, created_at, published_at from san_hub_catalog_items order by document_id, published_at desc nulls last, id desc) c order by created_at nulls last, id) t`);
const categories = queryJson(`select coalesce(json_agg(row_to_json(t)), '[]') from (select id, document_id, name, slug, description, sort_order, is_active, created_at, published_at from (select distinct on (document_id) id, document_id, name, slug, description, sort_order, is_active, created_at, published_at from course_categories order by document_id, published_at desc nulls last, id desc) c order by created_at nulls last, id) t`);
const duplicateSlugs = queryJson(`select coalesce(json_agg(row_to_json(t)), '[]') from (select slug, count(*)::int as count from (select distinct on (document_id) slug from san_hub_catalog_items order by document_id, published_at desc nulls last, id desc) c where slug is not null group by slug having count(*) > 1 order by slug) t`);
const categoryRelations = queryJson(`select coalesce(json_agg(row_to_json(t)), '[]') from (select distinct on (i.document_id) i.document_id as catalog_document_id, c.document_id as category_document_id from san_hub_catalog_items i join san_hub_catalog_items_course_category_lnk l on l.san_hub_catalog_item_id = i.id join course_categories c on c.id = l.course_category_id order by i.document_id, i.published_at desc nulls last, i.id desc, c.id) t`);
const missingCategoryLinks = queryJson(`select coalesce(json_agg(row_to_json(t)), '[]') from (select distinct on (i.document_id) i.document_id, i.slug, i.title from san_hub_catalog_items i where not exists (select 1 from san_hub_catalog_items i2 join san_hub_catalog_items_course_category_lnk l on l.san_hub_catalog_item_id = i2.id where i2.document_id = i.document_id) order by i.document_id, i.published_at desc nulls last, i.id desc) t`);
const media = queryJson(`select coalesce(json_agg(row_to_json(t)), '[]') from (select id, name, provider, hash, provider_metadata, url, mime, width, height, alternative_text from files order by id) t`);

const errors = [];
if (duplicateSlugs.length) errors.push(`${duplicateSlugs.length} duplicate catalog slug group(s)`);
const report = {
  generatedAt: new Date().toISOString(),
  source: { container, database },
  counts: { catalogItems: catalog.length, categories: categories.length, media: media.length, duplicateSlugGroups: duplicateSlugs.length, catalogItemsWithoutCategory: missingCategoryLinks.length },
  validation: { errors, status: errors.length ? "needs-review" : "ready-for-mapping" },
  catalog,
  categories,
  categoryRelations,
  media,
  duplicateSlugs,
  missingCategoryLinks,
};
const outputDir = path.resolve("tmp");
await fs.mkdir(outputDir, { recursive: true });
const output = path.join(outputDir, `strapi-dry-run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await fs.writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, counts: report.counts, validation: report.validation }, null, 2));
if (errors.length) process.exitCode = 2;