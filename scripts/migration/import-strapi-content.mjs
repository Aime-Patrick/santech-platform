import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const write = process.argv.includes("--write");
const fileArg = process.argv.find((value) => value.startsWith("--file="))?.slice("--file=".length)
  ?? "../cms/tmp/strapi-export-2026-10-21T07-41-02-903Z/content.json";
const sourcePath = path.resolve(fileArg);
const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const entries = Object.entries(source).flatMap(([contentType, collection]) =>
  (Array.isArray(collection?.data) ? collection.data : []).map((payload) => ({ contentType, payload })),
);

function date(value) {
  return value ? new Date(value) : null;
}
function metadata(payload) {
  return {
    sourceId: payload.id == null ? null : String(payload.id),
    sourceDocumentId: payload.documentId == null ? null : String(payload.documentId),
    slug: typeof payload.slug === "string" ? payload.slug : null,
    title: typeof payload.title === "string" ? payload.title : typeof payload.name === "string" ? payload.name : null,
    status: payload.publishedAt ? "PUBLISHED" : "DRAFT",
    publishedAt: date(payload.publishedAt),
    sourceCreatedAt: date(payload.createdAt),
    sourceUpdatedAt: date(payload.updatedAt),
  };
}

const summary = { contentTypes: new Set(entries.map(({ contentType }) => contentType)).size, entries: entries.length, mode: write ? "write" : "preview", source: sourcePath };
if (!write) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --write mode.");
const prisma = new PrismaClient();
const retryableCodes = new Set(["P1001", "P1017", "P2024", "P2028"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function writeEntry({ contentType, payload }) {
  const data = { contentType, ...metadata(payload), payload };
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      if (data.sourceDocumentId) {
        await prisma.cmsEntry.upsert({
          where: { contentType_sourceDocumentId: { contentType, sourceDocumentId: data.sourceDocumentId } },
          create: data,
          update: data,
        });
      } else {
        const existing = data.sourceId
          ? await prisma.cmsEntry.findFirst({ where: { contentType, sourceId: data.sourceId } })
          : null;
        if (existing) await prisma.cmsEntry.update({ where: { id: existing.id }, data });
        else await prisma.cmsEntry.create({ data });
      }
      return;
    } catch (error) {
      if (!retryableCodes.has(error?.code) || attempt === 4) throw error;
      await prisma.$disconnect().catch(() => {});
      await sleep(attempt * 500);
    }
  }
}

try {
  let imported = 0;
  for (const entry of entries) {
    await writeEntry(entry);
    imported += 1;
    if (imported % 10 === 0 || imported === entries.length) {
      console.log(`Imported ${imported}/${entries.length} content entries`);
    }
  }
  console.log(JSON.stringify({ ...summary, imported }, null, 2));
} finally {
  await prisma.$disconnect();
}
