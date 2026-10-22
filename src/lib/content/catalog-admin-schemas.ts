import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const catalogWriteSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(80),
  description: optionalText(500),
  provider: optionalText(150),
  format: optionalText(100),
  level: optionalText(100),
  badge: optionalText(80),
  subtitle: optionalText(500),
  instructorLabel: optionalText(200),
  durationLabel: optionalText(100),
  durationMin: z.number().int().nonnegative().nullable().optional(),
  durationMax: z.number().int().nonnegative().nullable().optional(),
  durationUnit: optionalText(40),
  rating: z.number().min(0).max(5).nullable().optional(),
  reviewCountLabel: optionalText(100),
  sortOrder: z.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  publishedAt: z.coerce.date().nullable().optional(),
  imageAssetId: z.string().trim().min(1).nullable().optional(),
  categoryId: z.string().trim().min(1).nullable().optional(),
  courseId: z.string().trim().min(1).nullable().optional(),
  skillIds: z.array(z.string().trim().min(1)).max(100).optional(),
  toolIds: z.array(z.string().trim().min(1)).max(100).optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string(), detail: z.string() })).optional(),
  learningOutcomes: z.array(z.object({ value: z.string() })).optional(),
  details: z.array(z.object({ title: z.string(), detail: z.string(), icon: z.enum(["certificate", "language", "schedule", "access"]) })).optional(),
  courseSeries: z.array(z.object({ title: z.string(), description: z.string(), duration: z.string() })).optional(),
  courseTestimonials: z.array(z.object({ initials: z.string(), name: z.string(), quote: z.string() })).optional(),
});

export const catalogUpdateSchema = catalogWriteSchema.partial();
