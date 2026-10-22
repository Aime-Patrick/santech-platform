import { prisma } from "@/lib/db/prisma";

export const APPLICATION_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const APPLICATION_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;

export function listPublishedCoursesForApplication() {
  return prisma.course.findMany({ where: { status: "PUBLISHED", catalogItem: { category: "Courses" } }, orderBy: { title: "asc" }, select: { id: true, title: true, slug: true } });
}

export function listLearnerApplications(applicantId: string) {
  return prisma.application.findMany({ where: { applicantId }, orderBy: { updatedAt: "desc" }, include: { course: { select: { id: true, title: true } }, cohort: { select: { id: true, name: true } }, files: { select: { id: true, name: true, mimeType: true, bytes: true, secureUrl: true } } } });
}

export function listApplicationsForReview() {
  return prisma.application.findMany({ orderBy: { updatedAt: "desc" }, include: { applicant: { select: { id: true, firstName: true, lastName: true, email: true } }, course: { select: { id: true, title: true } }, cohort: { select: { id: true, name: true } }, files: { select: { id: true, name: true, mimeType: true, bytes: true, secureUrl: true } }, reviewedBy: { select: { firstName: true, lastName: true } } } });
}
