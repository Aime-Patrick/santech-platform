import { prisma } from "@/lib/db/prisma";

export type EnrollmentRequestResult =
  | { kind: "created"; course: { id: string; title: string; slug: string }; enrollment: { id: string; status: string; appliedAt: Date } }
  | { kind: "existing"; course: { id: string; title: string; slug: string }; enrollment: { id: string; status: string } }
  | { kind: "unavailable" };

export async function requestCourseEnrollment(input: { learnerId: string; courseRef: string }): Promise<EnrollmentRequestResult> {
  const course = await prisma.course.findFirst({
    where: {
      status: "PUBLISHED",
      catalogItem: { category: "Courses" },
      OR: [{ id: input.courseRef }, { slug: input.courseRef }, { catalogItem: { slug: input.courseRef } }],
    },
    select: { id: true, title: true, slug: true },
  });
  if (!course) return { kind: "unavailable" };

  const existing = await prisma.enrollment.findFirst({
    where: { courseId: course.id, learnerId: input.learnerId, status: { notIn: ["REJECTED", "WITHDRAWN"] } },
    select: { id: true, status: true },
  });
  if (existing) return { kind: "existing", course, enrollment: existing };

  const enrollment = await prisma.enrollment.create({
    data: { courseId: course.id, learnerId: input.learnerId, status: "PENDING" },
    select: { id: true, status: true, appliedAt: true },
  });
  await prisma.auditLog.create({ data: { actorId: input.learnerId, action: "enrollment.applied", entityType: "Enrollment", entityId: enrollment.id, metadata: { courseId: course.id } } });
  return { kind: "created", course, enrollment };
}