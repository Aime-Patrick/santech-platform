import { prisma } from "@/lib/db/prisma";

export function listCourses(includeDraft = false) {
  return prisma.course.findMany({
    where: includeDraft ? undefined : { status: "PUBLISHED" },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { lessons: true, enrollments: true, cohorts: true } },
      instructors: { include: { instructor: { select: { firstName: true, lastName: true } } } },
    },
  });
}

export function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { sortOrder: "asc" }, include: { materials: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } },
      cohorts: { orderBy: { startsAt: "asc" } },
      instructors: { include: { instructor: { select: { firstName: true, lastName: true } } } },
      materials: { where: { isPublished: true, lessonId: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      _count: { select: { enrollments: true, lessons: true } },
    },
  });
}

export function getLearnerEnrollment(courseId: string, learnerId: string) {
  return prisma.enrollment.findFirst({
    where: {
      courseId,
      learnerId,
      status: { notIn: ["REJECTED", "WITHDRAWN"] },
    },
    orderBy: { appliedAt: "desc" },
  });
}



