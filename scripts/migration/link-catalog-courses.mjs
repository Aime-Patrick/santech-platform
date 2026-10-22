import { PrismaClient } from "@prisma/client";

const write = process.argv.includes("--write");
const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180) || "course";
const durationWeeks = (item) => {
  if (item.durationMin && item.durationUnit === "weeks") return item.durationMin;
  const match = String(item.durationLabel ?? "").match(/(\\d+)/);
  return match ? Number(match[1]) : null;
};
const prisma = new PrismaClient();
try {
  const items = await prisma.catalogItem.findMany({ orderBy: { sortOrder: "asc" }, include: { course: { select: { id: true, slug: true, title: true } } } });
  const existingCourses = await prisma.course.findMany({ select: { id: true, sourceId: true, sourceDocumentId: true, slug: true, title: true } });
  const aliases = new Map([["full-stack-web-application-development", "full-stack-web-engineering"], ["cloud-computing-devops-engineering", "cloud-architecture-devops"], ["applied-ai-machine-learning", "applied-ai-ml-systems"], ["cybersecurity-network-defense", "enterprise-cybersecurity"]]);
  const findMatch = (item) => existingCourses.find((course) => (aliases.get(item.slug) === course.slug) || (item.sourceDocumentId && course.sourceDocumentId === item.sourceDocumentId) || (item.sourceId && course.sourceId === item.sourceId) || course.slug === item.slug || course.title.trim().toLowerCase() === item.title.trim().toLowerCase());
  const preview = [];
  const usedSlugs = new Set((await prisma.course.findMany({ select: { slug: true } })).map((course) => course.slug));
  for (const item of items) {
    if (item.course) { preview.push({ catalogItemId: item.id, courseId: item.course.id, action: "already-linked" }); continue; }
    const match = findMatch(item);
    if (match) { preview.push({ catalogItemId: item.id, courseId: match.id, title: item.title, action: "link-existing" }); continue; }
    const baseSlug = slugify(item.slug || item.title);
    let slug = baseSlug; let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
    usedSlugs.add(slug);
    preview.push({ catalogItemId: item.id, title: item.title, slug, action: "create-and-link" });
  }
  if (!write) { console.log(JSON.stringify({ mode: "preview", total: items.length, alreadyLinked: preview.filter((x) => x.action === "already-linked").length, linkExisting: preview.filter((x) => x.action === "link-existing").length, toCreate: preview.filter((x) => x.action === "create-and-link").length, preview }, null, 2)); process.exit(0); }
  const result = await prisma.$transaction(async (tx) => {
    let created = 0; let linked = 0;
    for (const item of items) {
      if (item.course) { linked += 1; continue; }
      const match = findMatch(item);
      if (match) { await tx.catalogItem.update({ where: { id: item.id }, data: { courseId: match.id } }); linked += 1; continue; }
      const baseSlug = slugify(item.slug || item.title); let slug = baseSlug; let suffix = 2;
      while (await tx.course.findUnique({ where: { slug }, select: { id: true } })) slug = `${baseSlug}-${suffix++}`;
      const course = await tx.course.create({ data: { sourceId: item.sourceId, sourceDocumentId: item.sourceDocumentId, slug, title: item.title, summary: item.subtitle || item.description, description: item.description, level: item.level, durationWeeks: durationWeeks(item), status: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt } });
      await tx.catalogItem.update({ where: { id: item.id }, data: { courseId: course.id } }); created += 1; linked += 1;
    }
    return { created, linked };
  });
  console.log(JSON.stringify({ mode: "write", ...result }, null, 2));
} finally { await prisma.$disconnect(); }
