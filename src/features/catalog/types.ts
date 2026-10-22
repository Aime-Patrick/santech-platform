import type { CatalogPresentation } from "@/lib/content/catalog-schemas";

export type CatalogItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  provider: string | null;
  format: string | null;
  level: string | null;
  badge: string | null;
  subtitle: string | null;
  instructorLabel: string | null;
  durationLabel: string | null;
  durationMin: number | null;
  durationMax: number | null;
  durationUnit: string | null;
  rating: string | null;
  reviewCountLabel: string | null;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  imageAsset: { id?: string; publicId: string; url: string; alternativeText: string | null } | null;
  categoryId?: string | null;
  courseCategory: { id?: string; name: string; slug: string } | null;
  course: { id: string; slug: string; title?: string } | null;
  skills?: Array<{ skill: { id: string; name: string; slug: string }; sortOrder: number }>;
  tools?: Array<{ tool: { id: string; name: string; slug: string }; sortOrder: number }>;
  stats?: unknown;
  learningOutcomes?: unknown;
  details?: unknown;
  courseSeries?: unknown;
  courseTestimonials?: unknown;
  presentation?: CatalogPresentation;
};

export type CatalogListResponse = { data: CatalogItem[]; meta?: { total: number; limit: number } };
export type CatalogDetailResponse = { data: CatalogItem };

export type CatalogItemInput = Partial<Omit<CatalogItem, "id" | "imageAsset" | "courseCategory" | "course" | "presentation" | "rating">> & {
  title: string;
  slug: string;
  category: string;
  rating?: number | null;
  imageAssetId?: string | null;
  categoryId?: string | null;
  skillIds?: string[];
  toolIds?: string[];
  courseId?: string | null;
  stats?: CatalogPresentation["stats"];
  learningOutcomes?: CatalogPresentation["learningOutcomes"];
  details?: CatalogPresentation["details"];
  courseSeries?: CatalogPresentation["courseSeries"];
  courseTestimonials?: CatalogPresentation["courseTestimonials"];
};
