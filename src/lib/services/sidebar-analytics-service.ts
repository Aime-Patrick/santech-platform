import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/authorization/permissions";

type AnalyticsUser = Parameters<typeof hasPermission>[0];

export type SidebarAnalyticsHighlights = {
  averageAttendance: number | null;
  averageScore: number | null;
};

export async function getSidebarAnalyticsHighlights(
  user: AnalyticsUser,
): Promise<SidebarAnalyticsHighlights> {
  const canViewAttendance = hasPermission(user, "attendance.view");
  const canViewGrades = hasPermission(user, "grades.view");
  const activeRoleKeys = user.roles
    .filter(({ role }) => role.isActive)
    .map(({ role }) => role.key);
  const isAdministrator = activeRoleKeys.includes("administrator");
  const isLearnerOnly =
    activeRoleKeys.includes("learner") &&
    !activeRoleKeys.some((key) => ["administrator", "instructor"].includes(key));

  const assignedCourseFilter = {
    OR: [
      { instructors: { some: { instructorId: user.id } } },
      { cohorts: { some: { instructors: { some: { instructorId: user.id } } } } },
    ],
  };

  const attendanceWhere = isAdministrator
    ? {}
    : isLearnerOnly
      ? { learnerId: user.id }
      : {
          cohort: {
            OR: [
              { instructors: { some: { instructorId: user.id } } },
              { course: { instructors: { some: { instructorId: user.id } } } },
            ],
          },
        };
  const gradeWhere = isAdministrator
    ? {}
    : isLearnerOnly
      ? { learnerId: user.id }
      : { lesson: { course: assignedCourseFilter } };

  const [attendanceCounts, gradeAverage] = await Promise.all([
    canViewAttendance
      ? prisma.attendance.groupBy({
          by: ["status"],
          where: attendanceWhere,
          _count: { _all: true },
        })
      : Promise.resolve([]),
    canViewGrades
      ? prisma.grade.aggregate({
          where: gradeWhere,
          _avg: { score: true },
          _count: { _all: true },
        })
      : Promise.resolve(null),
  ]);

  const statusCounts = new Map(
    attendanceCounts.map(({ status, _count }) => [status, _count._all]),
  );
  const attended =
    (statusCounts.get("PRESENT") ?? 0) + (statusCounts.get("LATE") ?? 0);
  const expected =
    attended + (statusCounts.get("ABSENT") ?? 0);

  return {
    averageAttendance:
      canViewAttendance && expected > 0
        ? Math.round((attended / expected) * 100)
        : null,
    averageScore:
      canViewGrades && gradeAverage && gradeAverage._count._all > 0
        ? Math.round(gradeAverage._avg.score ?? 0)
        : null,
  };
}
