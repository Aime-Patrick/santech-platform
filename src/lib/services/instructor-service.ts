import { prisma } from "@/lib/db/prisma";

export function listInstructorCohorts(userId: string, includeAll = false) {
  return prisma.cohort.findMany({
    where: includeAll ? undefined : {
      OR: [
        { instructors: { some: { instructorId: userId } } },
        { course: { instructors: { some: { instructorId: userId } } } },
      ],
    },
    orderBy: [{ status: "asc" }, { startsAt: "asc" }],
    include: {
      course: { select: { id: true, title: true, slug: true } },
      members: { include: { learner: { select: { id: true, firstName: true, lastName: true } } } },
      _count: { select: { members: true, attendance: true } },
    },
  });
}

export function getInstructorCohort(cohortId: string, userId: string, includeAll = false) {
  return prisma.cohort.findFirst({
    where: {
      id: cohortId,
      ...(includeAll ? {} : {
        OR: [
          { instructors: { some: { instructorId: userId } } },
          { course: { instructors: { some: { instructorId: userId } } } },
        ],
      }),
    },
    include: {
      course: { include: { lessons: { orderBy: { sortOrder: "asc" } } } },
      members: { include: { learner: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      attendance: { orderBy: { sessionDate: "desc" }, include: { learner: { select: { id: true } }, lesson: { select: { id: true, title: true } } } },
    },
  });
}

export function getCohortGrades(courseId: string, learnerIds: string[]) {
  return prisma.grade.findMany({
    where: { learnerId: { in: learnerIds }, lesson: { courseId } },
    include: { lesson: { select: { id: true, title: true } }, learner: { select: { id: true } } },
  });
}

export function listInstructors() {
  return prisma.user.findMany({
    where: { status: "ACTIVE", roles: { some: { role: { key: "instructor", isActive: true } } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, email: true },
  });
}

