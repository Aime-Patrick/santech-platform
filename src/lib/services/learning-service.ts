import { prisma } from "@/lib/db/prisma";

export async function getLearnerDashboard(learnerId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { learnerId },
    orderBy: { appliedAt: "desc" },
    include: {
      course: { include: { lessons: { select: { id: true, title: true, sortOrder: true }, orderBy: { sortOrder: "asc" } } } },
      cohort: { select: { name: true, startsAt: true, endsAt: true } },
    },
  });
  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
  const [progress, attendance] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { learnerId, lesson: { courseId: { in: courseIds } } }, select: { lessonId: true, completedAt: true } }),
    prisma.attendance.findMany({ where: { learnerId, cohort: { courseId: { in: courseIds } } }, select: { cohortId: true, status: true } }),
  ]);

  return enrollments.map((enrollment) => {
    const completedLessons = progress.filter((item) => item.completedAt && enrollment.course.lessons.some((lesson) => lesson.id === item.lessonId));
    const courseAttendance = attendance.filter((item) => item.cohortId === enrollment.cohortId);
    return {
      ...enrollment,
      completedLessonCount: completedLessons.length,
      lessonCount: enrollment.course.lessons.length,
      attendanceCount: courseAttendance.length,
      presentAttendanceCount: courseAttendance.filter((item) => item.status === "PRESENT" || item.status === "LATE").length,
    };
  });
}

export function getLearnerAttendance(learnerId: string) {
  return prisma.attendance.findMany({
    where: { learnerId },
    orderBy: { sessionDate: "desc" },
    include: {
      cohort: { include: { course: { select: { title: true } } } },
      lesson: { select: { title: true } },
    },
  });
}

export function getCompletedLessonIds(courseId: string, learnerId: string) {
  return prisma.lessonProgress.findMany({
    where: { learnerId, lesson: { courseId }, completedAt: { not: null } },
    select: { lessonId: true },
  });
}

export function getCourseCohorts(courseId: string) {
  return prisma.cohort.findMany({
    where: { courseId },
    orderBy: [{ status: "asc" }, { startsAt: "asc" }],
    include: {
      members: { include: { learner: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
  });
}

export function getCourseEnrollments(courseId: string) {
  return prisma.enrollment.findMany({
    where: { courseId, status: { notIn: ["REJECTED", "WITHDRAWN"] } },
    orderBy: { appliedAt: "asc" },
    include: { learner: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

