import { z } from "zod";

export const courseStatSchema = z.object({
  label: z.string().max(80),
  value: z.string().max(100),
  detail: z.string().max(160),
});

export const courseListItemSchema = z.object({ value: z.string().max(240) });

export const courseDetailSchema = z.object({
  title: z.string().max(120),
  detail: z.string().max(400),
  icon: z.enum(["certificate", "language", "schedule", "access"]),
});

export const courseSeriesItemSchema = z.object({
  title: z.string().max(140),
  description: z.string().max(500),
  duration: z.string().max(80),
});

export const courseTestimonialSchema = z.object({
  initials: z.string().max(4),
  name: z.string().max(120),
  quote: z.string().max(600),
});

export const catalogPresentationSchema = z.object({
  stats: z.array(courseStatSchema).default([]),
  learningOutcomes: z.array(courseListItemSchema).default([]),
  details: z.array(courseDetailSchema).default([]),
  courseSeries: z.array(courseSeriesItemSchema).default([]),
  courseTestimonials: z.array(courseTestimonialSchema).default([]),
});

export type CatalogPresentation = z.infer<typeof catalogPresentationSchema>;

export function parseCatalogPresentation(value: unknown): CatalogPresentation {
  const result = catalogPresentationSchema.safeParse(value ?? {});
  return result.success ? result.data : catalogPresentationSchema.parse({});
}
