import { prisma } from "@/lib/db/prisma";
import { parseCatalogPresentation } from "@/lib/content/catalog-schemas";

export type CatalogQuery = {
  category?: string;
  search?: string;
  limit?: number;
};

export async function listPublishedCatalogItems(query: CatalogQuery = {}) {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
  const search = query.search?.trim();
  const where = {
    status: "PUBLISHED" as const,
    ...(query.category ? { category: query.category } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.catalogItem.findMany({
      where,
      take: limit,
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        description: true,
        provider: true,
        format: true,
        level: true,
        badge: true,
        subtitle: true,
        instructorLabel: true,
        durationLabel: true,
        durationMin: true,
        durationMax: true,
        durationUnit: true,
        rating: true,
        reviewCountLabel: true,
        sortOrder: true,
        imageAsset: { select: { url: true, publicId: true, alternativeText: true } },
        courseCategory: { select: { name: true, slug: true } },
        course: { select: { id: true, slug: true } },
        stats: true,
        learningOutcomes: true,
        details: true,
        courseSeries: true,
        courseTestimonials: true,
      },
    }),
    prisma.catalogItem.count({ where }),
  ]);

  return {
    data: items.map((item) => ({
      ...item,
      rating: item.rating?.toString() ?? null,
      presentation: parseCatalogPresentation({
        stats: item.stats,
        learningOutcomes: item.learningOutcomes,
        details: item.details,
        courseSeries: item.courseSeries,
        courseTestimonials: item.courseTestimonials,
      }),
    })),
    meta: { total, limit },
  };
}

export async function getPublishedCatalogItem(slug: string) {
  const item = await prisma.catalogItem.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      description: true,
      provider: true,
      format: true,
      level: true,
      badge: true,
      subtitle: true,
      instructorLabel: true,
      durationLabel: true,
      durationMin: true,
      durationMax: true,
      durationUnit: true,
      rating: true,
      reviewCountLabel: true,
      sortOrder: true,
      imageAsset: { select: { url: true, publicId: true, alternativeText: true } },
      courseCategory: { select: { name: true, slug: true } },
      course: { select: { id: true, slug: true } },
      stats: true,
      learningOutcomes: true,
      details: true,
      courseSeries: true,
      courseTestimonials: true,
    },
  });
  if (!item) return null;
  return {
    ...item,
    rating: item.rating?.toString() ?? null,
    presentation: parseCatalogPresentation({
      stats: item.stats,
      learningOutcomes: item.learningOutcomes,
      details: item.details,
      courseSeries: item.courseSeries,
      courseTestimonials: item.courseTestimonials,
    }),
  };
}
